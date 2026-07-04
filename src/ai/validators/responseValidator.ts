/**
 * responseValidator.ts — Validação de respostas da IA
 *
 * Garante que nenhum dado inválido ou malformado chega ao frontend.
 * Nunca deixa a aplicação quebrar com respostas inesperadas da IA.
 *
 * Estratégia:
 *  1. Fazer parse JSON com tratamento de erros
 *  2. Verificar campos obrigatórios
 *  3. Normalizar tipos (ex: strings numéricas → numbers)
 *  4. Lançar erros controlados com mensagens claras
 */

import type {
  ContentAnalysis, Exercise, Summary, FlashcardDeck,
  MockExam, AnswerExplanation, Question, AnswerOption,
  Flashcard, Difficulty, QuestionType, KeyConcept, LearningObjective,
} from '../types/ai';

// ─── Erros controlados ────────────────────────────────────────────────────────

export class AIValidationError extends Error {
  constructor(
    public readonly feature: string,
    public readonly field:   string,
    public readonly detail:  string
  ) {
    super(`[${feature}] Campo inválido "${field}": ${detail}`);
    this.name = 'AIValidationError';
  }
}

export class AIParseError extends Error {
  constructor(
    public readonly feature: string,
    public readonly raw:     string
  ) {
    super(`[${feature}] Não foi possível fazer parse do JSON da IA`);
    this.name = 'AIParseError';
  }
}

// ─── Parse JSON seguro ────────────────────────────────────────────────────────

/**
 * Faz parse do texto da IA em JSON.
 * Remove blocos de markdown (```json ... ```) se presentes.
 * Lança AIParseError se o JSON for inválido.
 */
export function parseAIJson(raw: string, feature: string): unknown {
  // Remover blocos markdown que a IA pode incluir por engano
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AIParseError(feature, cleaned);
  }
}

// ─── Validators de tipos primitivos ──────────────────────────────────────────

const VALID_DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil', 'muito_dificil'];
const VALID_QUESTION_TYPES: QuestionType[] = [
  'multiple-choice', 'true-false', 'open', 'fill-blank', 'calculation',
];

function assertString(val: unknown, feature: string, field: string): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new AIValidationError(feature, field, `esperava string não vazia, recebeu: ${JSON.stringify(val)}`);
  }
  return val.trim();
}

function assertNonEmptyArray(val: unknown, feature: string, field: string): unknown[] {
  if (!Array.isArray(val) || val.length === 0) {
    throw new AIValidationError(feature, field, `esperava array não vazio, recebeu: ${JSON.stringify(val)}`);
  }
  return val;
}

function normalizeDifficulty(val: unknown, feature: string, field: string): Difficulty {
  const normalized = String(val ?? '').toLowerCase().replace(/\s+/g, '_');
  if (!VALID_DIFFICULTIES.includes(normalized as Difficulty)) {
    // Fallback seguro em vez de lançar erro (a IA pode usar variantes)
    return 'medio';
  }
  return normalized as Difficulty;
}

function normalizeQuestionType(val: unknown): QuestionType {
  const normalized = String(val ?? '').toLowerCase();
  if (VALID_QUESTION_TYPES.includes(normalized as QuestionType)) {
    return normalized as QuestionType;
  }
  return 'multiple-choice'; // fallback seguro
}

// ─── Validator: ContentAnalysis ───────────────────────────────────────────────

export function validateContentAnalysis(raw: unknown): ContentAnalysis {
  const f = 'analyze_content';
  const d = raw as Record<string, unknown>;

  const keyConcepts: KeyConcept[] = assertNonEmptyArray(d.keyConcepts, f, 'keyConcepts')
    .map((k: any) => ({
      term:        assertString(k.term,       f, 'keyConcepts[].term'),
      definition:  assertString(k.definition, f, 'keyConcepts[].definition'),
      importance:  ['high','medium','low'].includes(k.importance) ? k.importance : 'medium',
    }));

  const learningObjectives: LearningObjective[] = assertNonEmptyArray(d.learningObjectives, f, 'learningObjectives')
    .map((o: any) => ({
      description: assertString(o.description, f, 'learningObjectives[].description'),
      bloomLevel:  o.bloomLevel ?? 'compreender',
    }));

  return {
    contentTitle:        assertString(d.contentTitle,   f, 'contentTitle'),
    subject:             assertString(d.subject,         f, 'subject'),
    keyConcepts,
    learningObjectives,
    topicSummary:        assertString(d.topicSummary,    f, 'topicSummary'),
    studyTips:           Array.isArray(d.studyTips) ? d.studyTips.map(String) : [],
    suggestedDifficulty: normalizeDifficulty(d.suggestedDifficulty, f, 'suggestedDifficulty'),
    relatedTopics:       Array.isArray(d.relatedTopics) ? d.relatedTopics.map(String) : [],
    analysedAt:          typeof d.analysedAt === 'string' ? d.analysedAt : new Date().toISOString(),
  };
}

// ─── Validator: Question ──────────────────────────────────────────────────────

function validateQuestion(q: any, feature: string): Question {
  const type = normalizeQuestionType(q.type);
  let options: AnswerOption[] | undefined;

  if (type === 'multiple-choice' || type === 'true-false') {
    if (Array.isArray(q.options) && q.options.length >= 2) {
      options = q.options.map((o: any) => ({
        id:        String(o.id ?? ''),
        text:      String(o.text ?? ''),
        isCorrect: Boolean(o.isCorrect),
      }));
    }
  }

  return {
    id:            assertString(q.id,           feature, 'question.id'),
    type,
    questionText:  assertString(q.questionText, feature, 'question.questionText'),
    options,
    correctAnswer: assertString(q.correctAnswer, feature, 'question.correctAnswer'),
    explanation:   typeof q.explanation === 'string' ? q.explanation : '',
    difficulty:    normalizeDifficulty(q.difficulty, feature, 'question.difficulty'),
    topic:         typeof q.topic === 'string' ? q.topic : undefined,
    hint:          typeof q.hint  === 'string' ? q.hint  : undefined,
    points:        typeof q.points === 'number' ? q.points : 1,
  };
}

// ─── Validator: Exercise ──────────────────────────────────────────────────────

export function validateExercise(raw: unknown): Exercise {
  const f = 'generate_exercises';
  const d = raw as Record<string, unknown>;

  const questions = assertNonEmptyArray(d.questions, f, 'questions')
    .map((q: any) => validateQuestion(q, f));

  return {
    id:            typeof d.id === 'string' ? d.id : `ex_${Date.now()}`,
    subjectName:   assertString(d.subjectName,   f, 'subjectName'),
    contentTitle:  typeof d.contentTitle === 'string' ? d.contentTitle : '',
    questions,
    totalPoints:   typeof d.totalPoints === 'number' ? d.totalPoints : questions.reduce((s, q) => s + q.points, 0),
    estimatedMins: typeof d.estimatedMins === 'number' ? d.estimatedMins : 15,
    difficulty:    normalizeDifficulty(d.difficulty, f, 'difficulty'),
    generatedAt:   typeof d.generatedAt === 'string' ? d.generatedAt : new Date().toISOString(),
  };
}

// ─── Validator: Summary ───────────────────────────────────────────────────────

export function validateSummary(raw: unknown): Summary {
  const f = 'generate_summary';
  const d = raw as Record<string, unknown>;

  const sections = assertNonEmptyArray(d.sections, f, 'sections').map((s: any) => ({
    title:   assertString(s.title,   f, 'section.title'),
    content: assertString(s.content, f, 'section.content'),
    bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
  }));

  return {
    id:             typeof d.id === 'string' ? d.id : `sum_${Date.now()}`,
    subjectName:    assertString(d.subjectName,  f, 'subjectName'),
    contentTitle:   assertString(d.contentTitle, f, 'contentTitle'),
    introduction:   assertString(d.introduction, f, 'introduction'),
    sections,
    keyFormulas:    Array.isArray(d.keyFormulas) ? d.keyFormulas.map(String) : [],
    conclusion:     assertString(d.conclusion, f, 'conclusion'),
    studyChecklist: Array.isArray(d.studyChecklist) ? d.studyChecklist.map(String) : [],
    generatedAt:    typeof d.generatedAt === 'string' ? d.generatedAt : new Date().toISOString(),
  };
}

// ─── Validator: FlashcardDeck ─────────────────────────────────────────────────

export function validateFlashcardDeck(raw: unknown): FlashcardDeck {
  const f = 'generate_flashcards';
  const d = raw as Record<string, unknown>;

  const cards: Flashcard[] = assertNonEmptyArray(d.cards, f, 'cards').map((c: any) => ({
    id:         assertString(c.id,    f, 'card.id'),
    front:      assertString(c.front, f, 'card.front'),
    back:       assertString(c.back,  f, 'card.back'),
    hint:       typeof c.hint  === 'string' ? c.hint  : undefined,
    topic:      typeof c.topic === 'string' ? c.topic : undefined,
    difficulty: normalizeDifficulty(c.difficulty, f, 'card.difficulty'),
    tags:       Array.isArray(c.tags) ? c.tags.map(String) : [],
  }));

  return {
    id:          typeof d.id === 'string' ? d.id : `deck_${Date.now()}`,
    subjectName: assertString(d.subjectName, f, 'subjectName'),
    topic:       typeof d.topic === 'string' ? d.topic : '',
    cards,
    generatedAt: typeof d.generatedAt === 'string' ? d.generatedAt : new Date().toISOString(),
  };
}

// ─── Validator: MockExam ──────────────────────────────────────────────────────

export function validateMockExam(raw: unknown): MockExam {
  const f = 'generate_mock_exam';
  const d = raw as Record<string, unknown>;

  const sections = assertNonEmptyArray(d.sections, f, 'sections').map((s: any) => ({
    title:     assertString(s.title,   f, 'section.title'),
    subject:   assertString(s.subject, f, 'section.subject'),
    questions: (Array.isArray(s.questions) ? s.questions : []).map((q: any) => validateQuestion(q, f)),
    points:    typeof s.points === 'number' ? s.points : 10,
  }));

  return {
    id:             typeof d.id === 'string' ? d.id : `exam_${Date.now()}`,
    title:          assertString(d.title, f, 'title'),
    description:    typeof d.description === 'string' ? d.description : undefined,
    sections,
    totalQuestions: typeof d.totalQuestions === 'number' ? d.totalQuestions : sections.reduce((s, sec) => s + sec.questions.length, 0),
    totalPoints:    typeof d.totalPoints   === 'number' ? d.totalPoints   : sections.reduce((s, sec) => s + sec.points, 0),
    timeLimitMins:  typeof d.timeLimitMins === 'number' ? d.timeLimitMins : 90,
    difficulty:     normalizeDifficulty(d.difficulty, f, 'difficulty'),
    generatedAt:    typeof d.generatedAt  === 'string' ? d.generatedAt   : new Date().toISOString(),
  };
}

// ─── Validator: AnswerExplanation ─────────────────────────────────────────────

export function validateAnswerExplanation(raw: unknown): AnswerExplanation {
  const f = 'explain_answer';
  const d = raw as Record<string, unknown>;

  return {
    questionText:    assertString(d.questionText,  f, 'questionText'),
    studentAnswer:   assertString(d.studentAnswer, f, 'studentAnswer'),
    correctAnswer:   assertString(d.correctAnswer, f, 'correctAnswer'),
    isCorrect:       Boolean(d.isCorrect),
    explanation:     assertString(d.explanation,   f, 'explanation'),
    whyWrong:        typeof d.whyWrong  === 'string' ? d.whyWrong  : undefined,
    studyTip:        typeof d.studyTip  === 'string' ? d.studyTip  : '',
    relatedConcepts: Array.isArray(d.relatedConcepts) ? d.relatedConcepts.map(String) : [],
  };
}
