/**
 * useAIExercises.ts
 *
 * Hook central da sessão de exercícios com IA.
 *
 * Responsabilidades:
 *  1. Gerar exercícios: reutiliza ContentAnalysis existente OU executa
 *     analyzeContent() automaticamente se ainda não existir.
 *  2. Persistir sessão, questões e respostas no Supabase.
 *  3. Gerir navegação entre questões e registo de respostas.
 *  4. Calcular resumo final (acertos, erros, %, tempo, tópicos difíceis).
 *  5. Nunca gerar exercícios duplicados para a mesma sessão — cada chamada
 *     de generateExercises cria um novo conjunto; o hook não repete
 *     chamadas para a mesma configuração já resolvida com sucesso.
 */

import { useState, useCallback, useRef } from 'react';
import { aiService } from '../ai/services/AIService';
import {
  createAISession,
  persistExerciseQuestions,
  submitAnswer,
  finishSession,
} from '../services/aiSessionsService';
import type { ContentAnalysis, Exercise, Question, Difficulty } from '../ai/types/ai';
import type { ContentRecord, Subject } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface QuestionAnswerState {
  questionId:     string;
  dbQuestionId:   string;
  studentAnswer:  string | null;
  isCorrect:      boolean | null;
  isRevealed:     boolean;
  answeredAt:     number | null; // timestamp ms
}

export interface ExerciseSessionSummary {
  totalQuestions:  number;
  correctCount:    number;
  incorrectCount:  number;
  scorePercent:    number;
  durationSeconds: number;
  difficultTopics: string[];   // tópicos onde o aluno errou
  recommendation:  string;     // recomendação textual do que estudar a seguir
}

export type GenerationPhase =
  | 'idle'
  | 'analysing'      // a correr analyzeContent() porque ainda não existe análise
  | 'generating'      // a correr generateExercises()
  | 'ready'
  | 'error';

export interface UseAIExercisesReturn {
  phase:          GenerationPhase;
  error:          string | null;
  exercise:       Exercise | null;
  analysisUsed:   ContentAnalysis | null;

  // Navegação
  currentIndex:   number;
  currentQuestion: Question | null;
  answers:        Record<string, QuestionAnswerState>;

  // Acções
  generate:        (params: GenerateExercisesArgs) => Promise<void>;
  answerQuestion:  (answer: string) => void;
  revealAnswer:    () => void;
  goToQuestion:    (index: number) => void;
  nextQuestion:    () => void;
  previousQuestion: () => void;
  finishAndSummarize: () => Promise<ExerciseSessionSummary>;

  isLastQuestion:  boolean;
  isFirstQuestion: boolean;
  allAnswered:     boolean;
}

export interface GenerateExercisesArgs {
  subject:          Subject;
  selectedContents:  ContentRecord[];
  existingAnalysis?: ContentAnalysis | null;
  difficulty:        Difficulty | 'mixed';
  questionCount:     5 | 10 | 15 | 20 | 30;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAIExercises(): UseAIExercisesReturn {
  const [phase, setPhase]           = useState<GenerationPhase>('idle');
  const [error, setError]           = useState<string | null>(null);
  const [exercise, setExercise]     = useState<Exercise | null>(null);
  const [analysisUsed, setAnalysisUsed] = useState<ContentAnalysis | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]       = useState<Record<string, QuestionAnswerState>>({});

  // Referências para persistência (não recriam a sessão entre respostas)
  const sessionIdRef   = useRef<string | null>(null);
  const startTimeRef    = useRef<number>(0);
  const idMapRef        = useRef<Record<string, string>>({}); // aiQuestionId → dbId
  // Evita gerar duas vezes para a mesma configuração (protecção contra duplo-click)
  const generatingRef   = useRef(false);

  // ── Gerar exercícios ────────────────────────────────────────────────────────
  const generate = useCallback(async (params: GenerateExercisesArgs) => {
    if (generatingRef.current) return; // já em curso — evita duplicação
    generatingRef.current = true;

    setError(null);
    setExercise(null);
    setAnswers({});
    setCurrentIndex(0);

    const { subject, selectedContents, existingAnalysis, difficulty, questionCount } = params;

    try {
      // Combinar conteúdos seleccionados num único input, tal como na análise
      const combinedTitle = selectedContents.length === 1
        ? selectedContents[0].title
        : `${selectedContents.length} conteúdos de ${subject.name}`;
      const combinedDescription = selectedContents
        .map(c => `[${c.date}] ${c.title}: ${c.description}`)
        .join('\n\n---\n\n');
      const combinedObservations = selectedContents
        .map(c => c.observations)
        .filter(Boolean)
        .join(' | ') || undefined;

      const contentInput = {
        title:        combinedTitle,
        description:  combinedDescription,
        observations: combinedObservations,
        subject:      subject.name,
      };
      const contextInput = {
        subjectName: subject.name,
        difficulty:  difficulty === 'mixed' ? undefined : difficulty,
        language:    'pt-PT' as const,
      };

      let analysis: ContentAnalysis | null = existingAnalysis ?? null;

      // ── Reutilizar análise existente OU analisar automaticamente ────────────
      if (!analysis) {
        setPhase('analysing');
        const analysisResult = await aiService.analyzeContent({
          content: contentInput,
          context: contextInput,
        });

        if (!analysisResult.success || !analysisResult.data) {
          setError(analysisResult.error ?? 'Não foi possível analisar o conteúdo.');
          setPhase('error');
          generatingRef.current = false;
          return;
        }
        analysis = analysisResult.data;
      }

      setAnalysisUsed(analysis);
      setPhase('generating');

      // ── Gerar exercícios reutilizando a análise ──────────────────────────────
      const exResult = await aiService.generateExercises({
        content:  contentInput,
        context:  contextInput,
        count:    questionCount,
        analysis, // reutilização explícita — nunca re-analisa
      });

      if (!exResult.success || !exResult.data) {
        setError(exResult.error ?? 'Não foi possível gerar os exercícios.');
        setPhase('error');
        generatingRef.current = false;
        return;
      }

      const generatedExercise = exResult.data;

      // ── Persistir sessão + questões no Supabase ─────────────────────────────
      try {
        const sessionId = await createAISession({ subjectId: subject.id });
        sessionIdRef.current = sessionId;

        const idMap = await persistExerciseQuestions(
          generatedExercise,
          subject.id,
          selectedContents[0]?.id, // rastreabilidade ao primeiro conteúdo seleccionado
        );
        idMapRef.current = idMap;
      } catch (persistErr) {
        // Falha de persistência não deve bloquear a experiência do aluno —
        // os exercícios continuam a funcionar em memória.
        console.error('[useAIExercises] Falha ao persistir sessão:', persistErr);
      }

      // Inicializar estado de respostas para cada questão
      const initialAnswers: Record<string, QuestionAnswerState> = {};
      generatedExercise.questions.forEach(q => {
        initialAnswers[q.id] = {
          questionId:    q.id,
          dbQuestionId:  idMapRef.current[q.id] ?? '',
          studentAnswer: null,
          isCorrect:     null,
          isRevealed:    false,
          answeredAt:    null,
        };
      });

      setAnswers(initialAnswers);
      setExercise(generatedExercise);
      startTimeRef.current = Date.now();
      setPhase('ready');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tenta novamente.');
      setPhase('error');
    } finally {
      generatingRef.current = false;
    }
  }, []);

  // ── Responder questão actual ────────────────────────────────────────────────
  const answerQuestion = useCallback((answer: string) => {
    if (!exercise) return;
    const question = exercise.questions[currentIndex];
    if (!question) return;

    const isCorrect = checkAnswer(question, answer);

    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        studentAnswer: answer,
        isCorrect,
        answeredAt: Date.now(),
      },
    }));

    // Persistir resposta no Supabase (silencioso em caso de falha)
    const dbId = answers[question.id]?.dbQuestionId;
    if (sessionIdRef.current && dbId) {
      submitAnswer(sessionIdRef.current, {
        questionDbId:  dbId,
        studentAnswer: answer,
        isCorrect,
      }).catch(err => console.error('[useAIExercises] Falha ao guardar resposta:', err));
    }
  }, [exercise, currentIndex, answers]);

  // ── Revelar resposta correcta ────────────────────────────────────────────────
  const revealAnswer = useCallback(() => {
    if (!exercise) return;
    const question = exercise.questions[currentIndex];
    if (!question) return;

    setAnswers(prev => ({
      ...prev,
      [question.id]: { ...prev[question.id], isRevealed: true },
    }));
  }, [exercise, currentIndex]);

  // ── Navegação ────────────────────────────────────────────────────────────────
  const goToQuestion = useCallback((index: number) => {
    if (!exercise) return;
    if (index < 0 || index >= exercise.questions.length) return;
    setCurrentIndex(index);
  }, [exercise]);

  const nextQuestion     = useCallback(() => goToQuestion(currentIndex + 1), [currentIndex, goToQuestion]);
  const previousQuestion = useCallback(() => goToQuestion(currentIndex - 1), [currentIndex, goToQuestion]);

  const isLastQuestion  = exercise ? currentIndex === exercise.questions.length - 1 : false;
  const isFirstQuestion = currentIndex === 0;
  const allAnswered     = exercise
    ? exercise.questions.every(q => answers[q.id]?.studentAnswer !== null)
    : false;

  // ── Finalizar e resumir ──────────────────────────────────────────────────────
  const finishAndSummarize = useCallback(async (): Promise<ExerciseSessionSummary> => {
    if (!exercise) {
      return {
        totalQuestions: 0, correctCount: 0, incorrectCount: 0,
        scorePercent: 0, durationSeconds: 0, difficultTopics: [], recommendation: '',
      };
    }

    const total     = exercise.questions.length;
    const correct   = exercise.questions.filter(q => answers[q.id]?.isCorrect === true).length;
    const incorrect = exercise.questions.filter(q => answers[q.id]?.isCorrect === false).length;
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Tópicos onde o aluno errou (para recomendação)
    const difficultTopics = [...new Set(
      exercise.questions
        .filter(q => answers[q.id]?.isCorrect === false && q.topic)
        .map(q => q.topic!)
    )];

    const recommendation = buildRecommendation(scorePercent, difficultTopics, analysisUsed);

    // Persistir score final da sessão
    if (sessionIdRef.current) {
      finishSession(sessionIdRef.current, scorePercent)
        .catch(err => console.error('[useAIExercises] Falha ao finalizar sessão:', err));
    }

    return {
      totalQuestions: total,
      correctCount:   correct,
      incorrectCount: incorrect,
      scorePercent,
      durationSeconds,
      difficultTopics,
      recommendation,
    };
  }, [exercise, answers, analysisUsed]);

  return {
    phase, error, exercise, analysisUsed,
    currentIndex,
    currentQuestion: exercise?.questions[currentIndex] ?? null,
    answers,
    generate, answerQuestion, revealAnswer,
    goToQuestion, nextQuestion, previousQuestion,
    finishAndSummarize,
    isLastQuestion, isFirstQuestion, allAnswered,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Verifica se a resposta do aluno está correcta.
 * Para multiple-choice/true-false: comparação exacta com o id/texto da opção correcta.
 * Para open: comparação textual case-insensitive (heurística simples;
 * avaliação semântica por IA fica para etapa futura de explainAnswer).
 */
function checkAnswer(question: Question, studentAnswer: string): boolean {
  const normalizedStudent = studentAnswer.trim().toLowerCase();
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase();

  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    // Aceitar tanto o id da opção (ex: "B") como o texto completo
    if (normalizedStudent === normalizedCorrect) return true;
    const matchedOption = question.options?.find(
      o => o.id.toLowerCase() === normalizedStudent
    );
    return matchedOption?.isCorrect ?? false;
  }

  // 'open', 'fill-blank', 'calculation': comparação directa simplificada
  return normalizedStudent === normalizedCorrect;
}

/**
 * Constrói uma recomendação textual do que estudar a seguir,
 * com base no desempenho e nos tópicos onde o aluno teve mais dificuldade.
 */
function buildRecommendation(
  scorePercent: number,
  difficultTopics: string[],
  analysis: ContentAnalysis | null
): string {
  if (scorePercent >= 90) {
    return 'Excelente desempenho! Dominas bem este conteúdo — considera avançar para o próximo tópico ou aumentar a dificuldade na próxima sessão.';
  }
  if (difficultTopics.length > 0) {
    const topicsStr = difficultTopics.slice(0, 3).join(', ');
    return `Revê com atenção: ${topicsStr}. ${
      analysis?.studyTips?.[0] ? `Dica: ${analysis.studyTips[0]}` : 'Repete os exercícios destes tópicos numa próxima sessão.'
    }`;
  }
  if (scorePercent >= 50) {
    return 'Bom trabalho, mas ainda há espaço para melhorar. Revê os conceitos-chave antes da próxima avaliação.';
  }
  return 'Este conteúdo precisa de mais revisão. Considera reler o material e repetir os exercícios com menor dificuldade.';
}
