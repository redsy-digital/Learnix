/**
 * subjectsService.ts
 *
 * Camada de acesso a dados para disciplinas.
 * Toda a comunicação com o Supabase relativa a `subjects` passa por aqui.
 * Nenhum componente ou página deve importar `supabase` directamente.
 */

import { supabase } from '../lib/supabase';
import type {
  SubjectStats,
  Subject,
  CreateSubjectPayload,
  UpdateSubjectPayload,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converte uma linha da VIEW subject_stats para o tipo Subject (UI).
 * Centraliza a transformação snake_case → camelCase num único lugar.
 */
export function statsToSubject(row: SubjectStats): Subject {
  return {
    id:               row.subject_id,
    name:             row.name,
    color:            row.color,
    colorHex:         row.color_hex,
    average:          Number(row.average ?? 0),
    performance:      Number(row.performance ?? 0),
    contentsCount:    Number(row.contents_count ?? 0),
    evaluationsCount: Number(row.evaluations_count ?? 0),
    lastActivity:     formatLastActivity(row.last_activity_date),
  };
}

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return 'Sem actividade';
  const date = new Date(dateStr);
  const now   = new Date();
  const diff  = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0)  return 'Hoje';
  if (diff === 1)  return 'Ontem';
  if (diff <= 7)   return `Há ${diff} dias`;
  if (diff <= 14)  return 'Há 1 semana';
  if (diff <= 30)  return 'Há algumas semanas';
  return 'Há mais de 1 mês';
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Carrega todas as disciplinas do utilizador autenticado
 * com métricas calculadas (via VIEW subject_stats).
 * Ordenadas alfabeticamente por nome.
 */
export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subject_stats')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);

  return (data as SubjectStats[]).map(statsToSubject);
}

/**
 * Cria uma nova disciplina para o utilizador autenticado.
 * O user_id é obtido da sessão activa e passado explicitamente —
 * o RLS valida que coincide com auth.uid().
 * Lança erro se o nome já existir (UNIQUE constraint no DB).
 */
export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  // Obter o utilizador autenticado da sessão activa
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  // Inserir com user_id explícito — obrigatório para satisfazer a política RLS
  const { data: inserted, error: insertError } = await supabase
    .from('subjects')
    .insert({
      user_id:   user.id,
      name:      payload.name.trim(),
      color:     payload.color,
      color_hex: payload.color_hex,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Já tens uma disciplina com esse nome. Escolhe um nome diferente.');
    }
    throw new Error(insertError.message);
  }

  // Carregar imediatamente via subject_stats para obter métricas
  const { data: stats, error: statsError } = await supabase
    .from('subject_stats')
    .select('*')
    .eq('subject_id', inserted.id)
    .single();

  if (statsError) throw new Error(statsError.message);

  return statsToSubject(stats as SubjectStats);
}

/**
 * Actualiza nome e/ou cor de uma disciplina existente.
 * Retorna a disciplina actualizada com métricas.
 */
export async function updateSubject(
  id: string,
  payload: UpdateSubjectPayload
): Promise<Subject> {
  const { error: updateError } = await supabase
    .from('subjects')
    .update({
      ...(payload.name      !== undefined && { name:      payload.name.trim() }),
      ...(payload.color     !== undefined && { color:     payload.color }),
      ...(payload.color_hex !== undefined && { color_hex: payload.color_hex }),
    })
    .eq('id', id);

  if (updateError) {
    if (updateError.code === '23505') {
      throw new Error('Já tens uma disciplina com esse nome. Escolhe um nome diferente.');
    }
    throw new Error(updateError.message);
  }

  // Recarregar via subject_stats
  const { data: stats, error: statsError } = await supabase
    .from('subject_stats')
    .select('*')
    .eq('subject_id', id)
    .single();

  if (statsError) throw new Error(statsError.message);

  return statsToSubject(stats as SubjectStats);
}

/**
 * Verifica se uma disciplina tem dados dependentes antes de apagar.
 * Retorna um objecto com a contagem de cada tipo de dependência.
 */
export async function checkSubjectDependencies(
  id: string
): Promise<{ contents: number; evaluations: number; scheduleSlots: number }> {
  const [contentsRes, evalsRes, scheduleRes] = await Promise.all([
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('subject_id', id),
    supabase.from('evaluations').select('id', { count: 'exact', head: true }).eq('subject_id', id),
    supabase.from('schedule_slots').select('id', { count: 'exact', head: true }).eq('subject_id', id),
  ]);

  return {
    contents:      contentsRes.count  ?? 0,
    evaluations:   evalsRes.count     ?? 0,
    scheduleSlots: scheduleRes.count  ?? 0,
  };
}

/**
 * Apaga uma disciplina.
 * O CASCADE no DB apaga automaticamente contents, evaluations e schedule_slots associados.
 * O chamador deve confirmar com o utilizador antes de invocar esta função.
 */
export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
