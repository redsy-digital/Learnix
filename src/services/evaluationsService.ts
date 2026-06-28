/**
 * evaluationsService.ts
 *
 * Camada de acesso a dados para avaliações escolares.
 * Toda a comunicação com o Supabase relativa a `evaluations` passa por aqui.
 * Após qualquer mutação, a VIEW `subject_stats` do Supabase reflecte
 * automaticamente as novas médias e rendimentos — sem cálculos no frontend.
 */

import { supabase } from '../lib/supabase';
import type { Evaluation } from '../types';

// ─── Tipos do serviço ─────────────────────────────────────────────────────────

type EvalType = 'Prova' | 'Trabalho' | 'Exercício' | 'Teste Surpresa' | 'Participação';

/** Linha da tabela `evaluations` com JOIN em subjects */
interface EvaluationRow {
  id: string;
  user_id: string;
  subject_id: string;
  eval_type: EvalType;
  eval_date: string;
  max_value: number;
  grade_obtained: number;
  notes: string | null;
  created_at: string;
  subjects: { name: string } | null;
}

export interface CreateEvaluationPayload {
  subjectId: string;
  evalType: EvalType;
  evalDate: string;
  maxValue: number;
  gradeObtained: number;
  notes?: string;
}

export interface UpdateEvaluationPayload {
  subjectId?: string;
  evalType?: EvalType;
  evalDate?: string;
  maxValue?: number;
  gradeObtained?: number;
  notes?: string;
}

// ─── Helper: DB row → UI type ─────────────────────────────────────────────────

function rowToEvaluation(row: EvaluationRow): Evaluation {
  return {
    id:            row.id,
    subjectId:     row.subject_id,
    subjectName:   row.subjects?.name ?? 'Sem disciplina',
    type:          row.eval_type,
    date:          row.eval_date,
    maxValue:      Number(row.max_value),
    gradeObtained: Number(row.grade_obtained),
    notes:         row.notes ?? undefined,
  };
}

const SELECT_QUERY = `
  id, user_id, subject_id, eval_type, eval_date,
  max_value, grade_obtained, notes, created_at,
  subjects ( name )
`;

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Carrega todas as avaliações do utilizador autenticado.
 * JOIN com subjects para obter o nome da disciplina.
 * Ordena da mais recente para a mais antiga.
 */
export async function fetchEvaluations(): Promise<Evaluation[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(SELECT_QUERY)
    .order('eval_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as EvaluationRow[]).map(rowToEvaluation);
}

/**
 * Cria uma nova avaliação.
 * user_id obtido da sessão activa e passado explicitamente (exigido pelo RLS).
 * Após a inserção, a VIEW subject_stats recalcula average e performance automaticamente.
 */
export async function createEvaluation(
  payload: CreateEvaluationPayload
): Promise<Evaluation> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  // Validação de negócio antes de ir ao DB
  if (payload.gradeObtained < 0) {
    throw new Error('A nota obtida não pode ser negativa.');
  }
  if (payload.gradeObtained > payload.maxValue) {
    throw new Error(`A nota obtida (${payload.gradeObtained}) não pode ser maior que o valor máximo (${payload.maxValue}).`);
  }
  if (payload.maxValue <= 0) {
    throw new Error('O valor máximo deve ser maior que zero.');
  }

  const { data, error } = await supabase
    .from('evaluations')
    .insert({
      user_id:        user.id,
      subject_id:     payload.subjectId,
      eval_type:      payload.evalType,
      eval_date:      payload.evalDate,
      max_value:      payload.maxValue,
      grade_obtained: payload.gradeObtained,
      notes:          payload.notes?.trim() || null,
    })
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToEvaluation(data as EvaluationRow);
}

/**
 * Actualiza uma avaliação existente.
 * Após a actualização, a VIEW subject_stats reflecte a nova média imediatamente.
 */
export async function updateEvaluation(
  id: string,
  payload: UpdateEvaluationPayload
): Promise<Evaluation> {
  // Validações de negócio
  if (payload.maxValue !== undefined && payload.maxValue <= 0) {
    throw new Error('O valor máximo deve ser maior que zero.');
  }
  if (
    payload.gradeObtained !== undefined &&
    payload.maxValue !== undefined &&
    payload.gradeObtained > payload.maxValue
  ) {
    throw new Error(`A nota (${payload.gradeObtained}) não pode ser maior que o valor máximo (${payload.maxValue}).`);
  }

  const updateData: Record<string, unknown> = {};
  if (payload.subjectId      !== undefined) updateData.subject_id     = payload.subjectId;
  if (payload.evalType       !== undefined) updateData.eval_type       = payload.evalType;
  if (payload.evalDate       !== undefined) updateData.eval_date       = payload.evalDate;
  if (payload.maxValue       !== undefined) updateData.max_value       = payload.maxValue;
  if (payload.gradeObtained  !== undefined) updateData.grade_obtained  = payload.gradeObtained;
  if (payload.notes          !== undefined) updateData.notes           = payload.notes.trim() || null;

  const { data, error } = await supabase
    .from('evaluations')
    .update(updateData)
    .eq('id', id)
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToEvaluation(data as EvaluationRow);
}

/**
 * Apaga uma avaliação.
 * A VIEW subject_stats recalcula a média da disciplina automaticamente.
 */
export async function deleteEvaluation(id: string): Promise<void> {
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
