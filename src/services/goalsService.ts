/**
 * goalsService.ts
 *
 * Camada de acesso a dados para metas académicas.
 * Toda a comunicação com o Supabase relativa a `goals` passa por aqui.
 *
 * Funcionalidade especial: cálculo automático de progresso
 * para categorias que têm dados reais no sistema (Notas, Estudo, Actividades).
 * Utiliza a VIEW subject_stats para médias — nunca recalcula no frontend.
 */

import { supabase } from '../lib/supabase';
import type { AcademicGoal } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GoalCategory = 'Estudo' | 'Notas' | 'Actividades' | 'Leitura' | 'Outro';

/** Linha da tabela `goals` tal como vem do Supabase */
interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target: number;
  current: number;
  unit: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalPayload {
  title: string;
  category: GoalCategory;
  target: number;
  unit: string;
  dueDate?: string;
}

export interface UpdateGoalPayload {
  title?: string;
  category?: GoalCategory;
  target?: number;
  unit?: string;
  dueDate?: string | null;
  current?: number;
}

// ─── Helper: DB row → AcademicGoal (UI) ──────────────────────────────────────

function rowToGoal(row: GoalRow): AcademicGoal {
  return {
    id:          row.id,
    title:       row.title,
    category:    row.category,
    target:      Number(row.target),
    current:     Number(row.current),
    unit:        row.unit,
    dueDate:     row.due_date ?? '',
    isCompleted: row.completed_at !== null,
  };
}

// ─── Auto-progresso ───────────────────────────────────────────────────────────

/**
 * Contexto de dados reais para calcular progresso automático.
 * Passado pelo hook ao chamar funções de carregamento.
 */
export interface AutoProgressContext {
  /** Médias da VIEW subject_stats: { subjectName: average } */
  subjectAverages: Record<string, number>;
  /** Total de conteúdos do utilizador */
  totalContents: number;
  /** Total de avaliações do utilizador */
  totalEvaluations: number;
}

/**
 * Tenta inferir o progresso automático de uma meta com base no título/unidade.
 * Devolve `null` se não consegue inferir (progresso manual).
 *
 * Heurísticas:
 *  - "Notas" + título com nome de disciplina + "média N" → usa subject_stats
 *  - "Estudo" + unit contém "conteúdo|resumo|ficha|aula" → usa totalContents
 *  - "Actividades" + unit contém "avaliação|prova|exercício" → usa totalEvaluations
 */
export function inferAutoProgress(
  goal: Pick<AcademicGoal, 'title' | 'category' | 'unit' | 'target'>,
  ctx: AutoProgressContext
): number | null {
  const titleLower = goal.title.toLowerCase();
  const unitLower  = goal.unit.toLowerCase();

  // Notas: verificar se o título menciona o nome de alguma disciplina com média
  if (goal.category === 'Notas') {
    for (const [name, avg] of Object.entries(ctx.subjectAverages)) {
      if (titleLower.includes(name.toLowerCase())) {
        // Cap no target para não ultrapassar 100%
        return Math.min(avg, goal.target);
      }
    }
    // Fallback: média geral (se a meta é genérica)
    const avgs = Object.values(ctx.subjectAverages);
    if (avgs.length > 0 && (titleLower.includes('média') || titleLower.includes('media'))) {
      const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
      return Math.min(parseFloat(overall.toFixed(1)), goal.target);
    }
  }

  // Estudo: conteúdos registados
  if (goal.category === 'Estudo') {
    if (
      unitLower.includes('conteúdo') ||
      unitLower.includes('resumo') ||
      unitLower.includes('ficha') ||
      unitLower.includes('aula') ||
      unitLower.includes('regist')
    ) {
      return Math.min(ctx.totalContents, goal.target);
    }
  }

  // Actividades: avaliações registadas
  if (goal.category === 'Actividades') {
    if (
      unitLower.includes('avaliação') ||
      unitLower.includes('avaliações') ||
      unitLower.includes('prova') ||
      unitLower.includes('exercício') ||
      unitLower.includes('teste')
    ) {
      return Math.min(ctx.totalEvaluations, goal.target);
    }
  }

  return null; // progresso manual
}

// ─── Service ──────────────────────────────────────────────────────────────────

const SELECT_QUERY = `
  id, user_id, title, category, target, current,
  unit, due_date, completed_at, created_at, updated_at
`;

/**
 * Carrega todas as metas do utilizador autenticado.
 * Ordena: activas primeiro, depois por created_at DESC.
 */
export async function fetchGoals(): Promise<AcademicGoal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(SELECT_QUERY)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as GoalRow[]).map(rowToGoal);
}

/**
 * Cria uma nova meta.
 * user_id obtido da sessão activa (exigido pelo RLS).
 */
export async function createGoal(payload: CreateGoalPayload): Promise<AcademicGoal> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  if (payload.target <= 0) throw new Error('O valor alvo deve ser maior que zero.');

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id:  user.id,
      title:    payload.title.trim(),
      category: payload.category,
      target:   payload.target,
      current:  0,
      unit:     payload.unit.trim(),
      due_date: payload.dueDate || null,
    })
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToGoal(data as GoalRow);
}

/**
 * Actualiza uma meta (título, categoria, target, unit, dueDate).
 * current é actualizado separadamente via updateGoalProgress.
 */
export async function updateGoal(
  id: string,
  payload: UpdateGoalPayload
): Promise<AcademicGoal> {
  if (payload.target !== undefined && payload.target <= 0) {
    throw new Error('O valor alvo deve ser maior que zero.');
  }

  const updateData: Record<string, unknown> = {};
  if (payload.title    !== undefined) updateData.title    = payload.title.trim();
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.target   !== undefined) updateData.target   = payload.target;
  if (payload.unit     !== undefined) updateData.unit     = payload.unit.trim();
  if (payload.dueDate  !== undefined) updateData.due_date = payload.dueDate || null;
  if (payload.current  !== undefined) updateData.current  = payload.current;

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToGoal(data as GoalRow);
}

/**
 * Marca uma meta como concluída (completed_at = now()) ou activa (completed_at = null).
 * Utiliza completed_at em vez de boolean — preserva quando foi concluída.
 */
export async function toggleGoalCompletion(
  id: string,
  isCurrentlyCompleted: boolean
): Promise<AcademicGoal> {
  const { data, error } = await supabase
    .from('goals')
    .update({
      completed_at: isCurrentlyCompleted ? null : new Date().toISOString(),
    })
    .eq('id', id)
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToGoal(data as GoalRow);
}

/**
 * Actualiza apenas o campo `current` de uma meta (progresso manual).
 */
export async function updateGoalProgress(
  id: string,
  current: number
): Promise<AcademicGoal> {
  const { data, error } = await supabase
    .from('goals')
    .update({ current: Math.max(0, current) })
    .eq('id', id)
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToGoal(data as GoalRow);
}

/**
 * Apaga uma meta permanentemente.
 */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
