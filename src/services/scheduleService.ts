/**
 * scheduleService.ts
 *
 * Camada de acesso a dados para o horário escolar.
 * Toda a comunicação com o Supabase relativa a `schedule_slots` passa por aqui.
 *
 * Mapeamento de dia da semana:
 *  DB usa day_of_week (smallint 0-6, ISO: 0=Domingo...6=Sábado)
 *  UI usa day (string PT: 'Segunda', 'Terça'...) — mantido para compatibilidade
 *  com o design existente, conforme types.ts (ScheduleSlot.day: string).
 */

import { supabase } from '../lib/supabase';
import type { ScheduleSlot } from '../types';

// ─── Mapeamento dia da semana DB ↔ UI ────────────────────────────────────────

/** day_of_week (0=Dom...6=Sáb) → nome PT usado no frontend */
const DAY_NUMBER_TO_NAME: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

/** nome PT → day_of_week (0=Dom...6=Sáb) */
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Domingo: 0,
  Segunda: 1,
  Terça:   2,
  Quarta:  3,
  Quinta:  4,
  Sexta:   5,
  Sábado:  6,
};

export function dayNameToNumber(name: string): number {
  const num = DAY_NAME_TO_NUMBER[name];
  if (num === undefined) throw new Error(`Dia da semana inválido: "${name}"`);
  return num;
}

export function dayNumberToName(num: number): string {
  return DAY_NUMBER_TO_NAME[num] ?? 'Desconhecido';
}

// ─── Tipos do serviço ─────────────────────────────────────────────────────────

/** Linha da tabela `schedule_slots` com JOIN em subjects */
interface ScheduleRow {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string; // formato "HH:MM:SS" do PostgreSQL
  end_time: string;
  room: string | null;
  created_at: string;
  subjects: { name: string; color_hex: string } | null;
}

export interface CreateScheduleSlotPayload {
  subjectId: string;
  dayName: string;      // 'Segunda', 'Terça', etc.
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
  room?: string;
}

export interface UpdateScheduleSlotPayload {
  subjectId?: string;
  dayName?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove os segundos do formato HH:MM:SS vindo do PostgreSQL → HH:MM */
function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

/** Converte uma linha do DB para o tipo ScheduleSlot (UI) */
function rowToScheduleSlot(row: ScheduleRow): ScheduleSlot {
  const start = trimSeconds(row.start_time);
  const end   = trimSeconds(row.end_time);
  return {
    id:          row.id,
    day:         dayNumberToName(row.day_of_week),
    time:        `${start} - ${end}`,
    subjectId:   row.subject_id,
    subjectName: row.subjects?.name ?? 'Sem disciplina',
    room:        row.room ?? undefined,
  };
}

const SELECT_QUERY = `
  id, user_id, subject_id, day_of_week,
  start_time, end_time, room, created_at,
  subjects ( name, color_hex )
`;

/**
 * Traduz erros de constraint do PostgreSQL para mensagens amigáveis.
 */
function translateDbError(error: { code?: string; message: string }): string {
  // unique_violation — mesmo dia + mesma hora de início para o utilizador
  if (error.code === '23505') {
    return 'Já tens uma aula registada exactamente a essa hora e dia. Escolhe outro horário.';
  }
  // check_violation — end_time <= start_time ou day_of_week fora de 0-6
  if (error.code === '23514') {
    if (error.message.includes('schedule_time_check')) {
      return 'A hora de término deve ser depois da hora de início.';
    }
    if (error.message.includes('day_of_week')) {
      return 'Dia da semana inválido.';
    }
    return 'Os horários introduzidos não são válidos.';
  }
  // foreign_key_violation — disciplina não existe ou não pertence ao utilizador
  if (error.code === '23503') {
    return 'A disciplina seleccionada já não existe. Actualiza a página e tenta novamente.';
  }
  return error.message;
}

// ─── Validação de overlap (complementar à constraint do DB) ─────────────────

/**
 * Verifica se um novo slot colide com slots existentes no mesmo dia.
 * A constraint do DB só bloqueia start_time idêntico — esta validação
 * cobre overlaps parciais (ex: 08:00-09:00 vs 08:30-09:30).
 */
export function hasOverlap(
  existingSlots: ScheduleSlot[],
  dayName: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const newStart = toMinutes(startTime);
  const newEnd   = toMinutes(endTime);

  return existingSlots.some((slot) => {
    if (slot.id === excludeId) return false;
    if (slot.day !== dayName) return false;
    const [slotStartStr, slotEndStr] = slot.time.split(' - ');
    const slotStart = toMinutes(slotStartStr);
    const slotEnd   = toMinutes(slotEndStr);
    // Overlap clássico: novo início antes do fim existente E novo fim depois do início existente
    return newStart < slotEnd && newEnd > slotStart;
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Carrega todos os slots de horário do utilizador autenticado.
 * Ordena por dia da semana e depois por hora de início.
 */
export async function fetchScheduleSlots(): Promise<ScheduleSlot[]> {
  const { data, error } = await supabase
    .from('schedule_slots')
    .select(SELECT_QUERY)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ScheduleRow[]).map(rowToScheduleSlot);
}

/**
 * Cria um novo slot de horário.
 * user_id obtido da sessão activa e passado explicitamente (exigido pelo RLS).
 */
export async function createScheduleSlot(
  payload: CreateScheduleSlotPayload
): Promise<ScheduleSlot> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Sessão inválida. Inicia sessão novamente.');

  const dayOfWeek = dayNameToNumber(payload.dayName);

  const { data, error } = await supabase
    .from('schedule_slots')
    .insert({
      user_id:     user.id,
      subject_id:  payload.subjectId,
      day_of_week: dayOfWeek,
      start_time:  payload.startTime,
      end_time:    payload.endTime,
      room:        payload.room?.trim() || null,
    })
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(translateDbError(error));
  return rowToScheduleSlot(data as ScheduleRow);
}

/**
 * Actualiza um slot de horário existente.
 */
export async function updateScheduleSlot(
  id: string,
  payload: UpdateScheduleSlotPayload
): Promise<ScheduleSlot> {
  const updateData: Record<string, unknown> = {};
  if (payload.subjectId !== undefined) updateData.subject_id  = payload.subjectId;
  if (payload.dayName   !== undefined) updateData.day_of_week = dayNameToNumber(payload.dayName);
  if (payload.startTime !== undefined) updateData.start_time  = payload.startTime;
  if (payload.endTime   !== undefined) updateData.end_time    = payload.endTime;
  if (payload.room      !== undefined) updateData.room        = payload.room.trim() || null;

  const { data, error } = await supabase
    .from('schedule_slots')
    .update(updateData)
    .eq('id', id)
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(translateDbError(error));
  return rowToScheduleSlot(data as ScheduleRow);
}

/**
 * Apaga um slot de horário.
 */
export async function deleteScheduleSlot(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_slots')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
