/**
 * ai.ts — Sistema de tipos completo para a camada de IA do Learnix
 *
 * Princípio: nenhuma outra parte do projecto depende de tipos específicos
 * de qualquer fornecedor (Gemini, OpenAI, etc.). Todos os contratos
 * são definidos aqui e o resto do projecto só fala com estes tipos.
 */

// ─── Enums e literais ─────────────────────────────────────────────────────────

/** Nível de dificuldade de um exercício ou flashcard */
export type Difficulty = 'facil' | 'medio' | 'dificil' | 'muito_dificil';

/** Tipo de questão */
export type QuestionType =
  | 'multiple-choice'   // escolha múltipla
  | 'true-false'        // verdadeiro/falso
  | 'open'              // resposta aberta
  | 'fill-blank'        // preencher lacunas
  | 'calculation';      // cálculo numérico

/** Idioma de output da IA (por defeito: pt-PT) */
export type AILanguage = 'pt-PT' | 'pt-BR' | 'en';

/** Fornecedor de IA disponível */
export type AIProviderName = 'gemini' | 'mock';

// ─── Contexto de entrada ──────────────────────────────────────────────────────

/**
 * Contexto académico do utilizador passado a todos os prompts.
 * Permite personalização sem repetir lógica nos prompts individuais.
 */
export interface AcademicContext {
  subjectName:  string;
  schoolYear?:  string;
  topics?:      string[];       // tópicos/subtemas do conteúdo
  difficulty?:  Difficulty;
  language?:    AILanguage;
}

/**
 * Conteúdo de entrada para análise, geração de exercícios, etc.
 * Espelha os campos relevantes de ContentRecord — desacoplado do tipo UI.
 */
export interface ContentInput {
  title:        string;
  description:  string;
  observations?: string;
  subject:      string;
  date?:        string;
}

// ─── Análise de Conteúdo ──────────────────────────────────────────────────────

/** Conceito-chave extraído de um conteúdo */
export interface KeyConcept {
  term:        string;
  definition:  string;
  importance:  'high' | 'medium' | 'low';
}

/** Objectivo de aprendizagem identificado pela IA */
export interface LearningObjective {
  description: string;
  bloomLevel:  'lembrar' | 'compreender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar';
}

/**
 * Análise estruturada de um conteúdo académico.
 * Este é o tipo central: uma única análise alimenta resumos, exercícios,
 * flashcards e simulados — a IA analisa o conteúdo apenas uma vez.
 */
export interface ContentAnalysis {
  contentTitle:       string;
  subject:            string;
  keyConcepts:        KeyConcept[];
  learningObjectives: LearningObjective[];
  topicSummary:       string;          // parágrafo de 2-3 linhas
  studyTips:          string[];        // dicas práticas de estudo
  suggestedDifficulty: Difficulty;
  relatedTopics?:     string[];        // tópicos relacionados para estudo adicional
  analysedAt:         string;          // ISO timestamp
}

// ─── Exercícios ───────────────────────────────────────────────────────────────

/** Opção de resposta para questão de escolha múltipla */
export interface AnswerOption {
  id:       string;   // 'A', 'B', 'C', 'D'
  text:     string;
  isCorrect: boolean;
}

/** Questão individual */
export interface Question {
  id:              string;
  type:            QuestionType;
  questionText:    string;
  options?:        AnswerOption[];      // só para multiple-choice e true-false
  correctAnswer:   string;              // texto ou id da opção
  explanation:     string;              // explicação detalhada da resposta
  difficulty:      Difficulty;
  topic?:          string;              // tópico específico dentro da matéria
  hint?:           string;              // dica opcional para o aluno
  points:          number;              // peso da questão (1-10)
}

/** Resultado de resposta dada pelo aluno */
export interface Answer {
  questionId:    string;
  studentAnswer: string;
  isCorrect:     boolean;
  timeSpentMs?:  number;
}

/** Conjunto de exercícios gerados para uma sessão */
export interface Exercise {
  id:            string;
  subjectName:   string;
  contentTitle?: string;
  questions:     Question[];
  totalPoints:   number;
  estimatedMins: number;
  difficulty:    Difficulty;
  generatedAt:   string;
}

// ─── Resumo ───────────────────────────────────────────────────────────────────

/** Secção de um resumo estruturado */
export interface SummarySection {
  title:   string;
  content: string;
  bullets: string[];
}

/** Resumo académico gerado pela IA */
export interface Summary {
  id:             string;
  subjectName:    string;
  contentTitle:   string;
  introduction:   string;
  sections:       SummarySection[];
  keyFormulas?:   string[];     // fórmulas ou regras importantes
  conclusion:     string;
  studyChecklist: string[];     // checklist do que o aluno deve dominar
  generatedAt:    string;
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

/** Cartão de memorização */
export interface Flashcard {
  id:          string;
  front:       string;       // pergunta ou termo
  back:        string;       // resposta ou definição
  hint?:       string;
  topic?:      string;
  difficulty:  Difficulty;
  tags:        string[];
}

/** Deck de flashcards */
export interface FlashcardDeck {
  id:          string;
  subjectName: string;
  topic:       string;
  cards:       Flashcard[];
  generatedAt: string;
}

// ─── Simulados ────────────────────────────────────────────────────────────────

/** Secção de um simulado (por disciplina ou tópico) */
export interface MockExamSection {
  title:     string;
  subject:   string;
  questions: Question[];
  points:    number;
}

/** Simulado completo */
export interface MockExam {
  id:             string;
  title:          string;
  description?:   string;
  sections:       MockExamSection[];
  totalQuestions: number;
  totalPoints:    number;
  timeLimitMins:  number;
  difficulty:     Difficulty;
  generatedAt:    string;
}

// ─── Recomendações ────────────────────────────────────────────────────────────

/** Recomendação de estudo gerada pela IA */
export interface StudyRecommendation {
  subjectName:  string;
  priority:     'high' | 'medium' | 'low';
  reason:       string;
  action:       string;      // o que o aluno deve fazer concretamente
  estimatedMins: number;
}

// ─── Respostas da IA ─────────────────────────────────────────────────────────

/**
 * Envelope genérico de resposta de qualquer operação de IA.
 * Garante tratamento uniforme de erros em toda a aplicação.
 */
export interface AIResponse<T> {
  success:    boolean;
  data?:      T;
  error?:     string;
  provider:   AIProviderName;
  model?:     string;          // ex: "gemini-1.5-flash"
  latencyMs?: number;
  tokensUsed?: number;
}

/**
 * Resultado de construção de prompt — separado para facilitar logging e debug.
 */
export interface PromptResult {
  systemPrompt: string;
  userPrompt:   string;
  metadata: {
    feature:     string;
    subject?:    string;
    difficulty?: Difficulty;
    builtAt:     string;
  };
}

// ─── Parâmetros de entrada por funcionalidade ─────────────────────────────────

export interface GenerateExercisesParams {
  content:    ContentInput;
  context:    AcademicContext;
  count?:     number;          // número de questões (default: 5)
  types?:     QuestionType[];  // tipos de questão desejados
  analysis?:  ContentAnalysis; // reutilizar análise prévia se disponível
}

export interface GenerateSummaryParams {
  content:   ContentInput;
  context:   AcademicContext;
  style?:    'bullet-points' | 'narrative' | 'mixed'; // default: mixed
  analysis?: ContentAnalysis;
}

export interface GenerateFlashcardsParams {
  content:   ContentInput;
  context:   AcademicContext;
  count?:    number;           // número de flashcards (default: 10)
  analysis?: ContentAnalysis;
}

export interface GenerateMockExamParams {
  subjects:    string[];        // lista de disciplinas
  contents:    ContentInput[];  // conteúdos a incluir
  contexts:    AcademicContext[];
  totalQs?:   number;          // total de questões (default: 20)
  timeMins?:  number;          // duração em minutos (default: 90)
}

export interface AnalyzeContentParams {
  content:  ContentInput;
  context:  AcademicContext;
}

export interface ExplainAnswerParams {
  question:      Question;
  studentAnswer: string;
  isCorrect:     boolean;
  context:       AcademicContext;
}

// ─── Explicação de resposta ───────────────────────────────────────────────────

/** Explicação detalhada e pedagógica de uma resposta */
export interface AnswerExplanation {
  questionText:   string;
  studentAnswer:  string;
  correctAnswer:  string;
  isCorrect:      boolean;
  explanation:    string;    // explicação conceptual
  whyWrong?:      string;    // só se isCorrect = false
  studyTip:       string;    // dica de estudo relacionada
  relatedConcepts: string[]; // conceitos a rever
}
