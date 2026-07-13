/**
 * aiSessionsService.ts
 *
 * Camada de acesso a dados para sessões de IA (exercícios gerados,
 * respostas do utilizador e pontuação final).
 *
 * Tabelas envolvidas (já existentes desde a Fase 2 da arquitectura):
 *  - ai_sessions          → uma sessão de treino (um "Gerar Exercícios")
 *  - ai_question_banks    → as questões geradas nessa sessão
 *  - ai_session_answers   → as respostas dadas pelo aluno
 *
 * Nenhum componente ou hook acede a estas tabelas directamente.
 */

import { supabase } from '../lib/supabase';
import type { Exercise, Question } from '../ai/types/ai';

// ─── Tipos do serviço ─────────────────────────────────────────────────────────

export interface CreateSessionPayload {
  subjectId?: string;
}

export interface PersistedQuestion {
  id:            string;  // uuid gerado pelo Supabase — substitui o id da IA
  aiQuestionId:  string;  // id original vindo da IA (para mapear respostas)
}

export interface SubmitAnswerPayload {
  questionDbId:  string;   // uuid da questão em ai_question_banks
  studentAnswer: string;
  isCorrect:     boolean;
}

export interface SessionResultSummary {
  sessionId:      string;
  totalQuestions: number;
  correctCount:   number;
  incorrectCount: number;
  scorePercent:   number;
  durationSeconds: number;
}

// ─── Criar sessão ─────────────────────────────────────────────────────────────

/**
 * Cria uma nova sessão de IA (ai_sessions) associada ao utilizador autenticado.
 * Retorna o id da sessão para associar questões e respostas.
 */
export async function createAISession(
  payload: CreateSessionPayload
): Promise<string> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  const { data, error } = await supabase
    .from('ai_sessions')
    .insert({
      user_id:    user.id,
      subject_id: payload.subjectId ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

// ─── Persistir questões geradas ───────────────────────────────────────────────

/**
 * Persiste as questões de um Exercise gerado na tabela ai_question_banks.
 * Guarda user_id (questão privada, não partilhada) e source_content_id
 * quando disponível, para rastreabilidade conteúdo → questão.
 *
 * Retorna um mapa { aiQuestionId → dbQuestionId } para que o frontend
 * consiga associar as respostas do aluno às linhas persistidas no DB.
 */
export async function persistExerciseQuestions(
  exercise:  Exercise,
  subjectId: string,
  sourceContentId?: string
): Promise<Record<string, string>> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  const rows = exercise.questions.map((q: Question) => ({
    user_id:           user.id,
    subject_id:        subjectId,
    question_type:     q.type,
    question:          q.questionText,
    options:           q.options ? JSON.stringify(q.options) : null,
    correct_answer:    q.correctAnswer,
    explanation:       q.explanation,
    difficulty:        difficultyToInt(q.difficulty),
    topic_tags:        q.topic ? [q.topic] : [],
    source_content_id: sourceContentId ?? null,
  }));

  const { data, error } = await supabase
    .from('ai_question_banks')
    .insert(rows)
    .select('id, question');

  if (error) throw new Error(error.message);

  // Mapear de volta: como a ordem de inserção é preservada, associamos
  // pela posição — mais seguro seria por texto exacto, usado aqui como chave.
  const idMap: Record<string, string> = {};
  exercise.questions.forEach((q, i) => {
    idMap[q.id] = data[i]?.id ?? '';
  });

  return idMap;
}

function difficultyToInt(d: string): number {
  const map: Record<string, number> = {
    facil: 1, medio: 2, dificil: 4, muito_dificil: 5,
  };
  return map[d] ?? 2;
}

// ─── Submeter respostas ───────────────────────────────────────────────────────

/**
 * Regista uma resposta individual do aluno em ai_session_answers.
 */
export async function submitAnswer(
  sessionId: string,
  payload:   SubmitAnswerPayload
): Promise<void> {
  const { error } = await supabase
    .from('ai_session_answers')
    .insert({
      session_id:     sessionId,
      question_id:    payload.questionDbId,
      student_answer: payload.studentAnswer,
      is_correct:     payload.isCorrect,
    });

  if (error) throw new Error(error.message);
}

// ─── Finalizar sessão ─────────────────────────────────────────────────────────

/**
 * Marca a sessão como concluída, calculando e guardando o score final.
 */
export async function finishSession(
  sessionId: string,
  scorePercent: number
): Promise<void> {
  const { error } = await supabase
    .from('ai_sessions')
    .update({
      finished_at: new Date().toISOString(),
      score:       scorePercent,
    })
    .eq('id', sessionId);

  if (error) throw new Error(error.message);
}
