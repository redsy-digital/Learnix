/**
 * useSchedule.ts
 *
 * Hook que centraliza o estado reactivo do horário escolar.
 * Consome o scheduleService (que fala com o Supabase).
 *
 * Inclui validação de overlap no cliente antes de enviar ao DB —
 * a constraint do DB só cobre start_time idêntico; este hook cobre
 * overlaps parciais para dar feedback imediato ao utilizador.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ScheduleSlot } from '../types';
import {
  fetchScheduleSlots,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
  hasOverlap,
  type CreateScheduleSlotPayload,
  type UpdateScheduleSlotPayload,
} from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';

// ─── Ordem dos dias para ordenação consistente na UI ─────────────────────────

const DAY_ORDER: Record<string, number> = {
  Domingo: 0, Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6,
};

function sortSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });
}

// ─── Tipos expostos pelo hook ─────────────────────────────────────────────────

export interface UseScheduleReturn {
  schedule: ScheduleSlot[];
  isLoading: boolean;
  error: string | null;

  addScheduleSlot:    (payload: CreateScheduleSlotPayload) => Promise<ScheduleSlot>;
  editScheduleSlot:   (id: string, payload: UpdateScheduleSlotPayload) => Promise<ScheduleSlot>;
  removeScheduleSlot: (id: string) => Promise<void>;

  /** Verifica overlap no cliente antes de submeter — usado pela UI para feedback imediato */
  checkOverlap: (dayName: string, startTime: string, endTime: string, excludeId?: string) => boolean;

  refresh:    () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedule(): UseScheduleReturn {
  const { isLoggedIn } = useAuth();

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Carregar horário ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchScheduleSlots();
      setSchedule(sortSlots(data));
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // ── Verificar overlap (síncrono, sem ir ao DB) ───────────────────────────────
  const checkOverlap = useCallback((
    dayName: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): boolean => {
    return hasOverlap(schedule, dayName, startTime, endTime, excludeId);
  }, [schedule]);

  // ── Criar slot ────────────────────────────────────────────────────────────────
  const addScheduleSlot = useCallback(async (
    payload: CreateScheduleSlotPayload
  ): Promise<ScheduleSlot> => {
    setError(null);

    // Validação de overlap no cliente antes de ir ao DB
    if (hasOverlap(schedule, payload.dayName, payload.startTime, payload.endTime)) {
      throw new Error('Já existe uma aula nesse horário. Os horários não podem sobrepor-se.');
    }

    const created = await createScheduleSlot(payload);
    setSchedule((prev) => sortSlots([...prev, created]));
    return created;
  }, [schedule]);

  // ── Editar slot ───────────────────────────────────────────────────────────────
  const editScheduleSlot = useCallback(async (
    id: string,
    payload: UpdateScheduleSlotPayload
  ): Promise<ScheduleSlot> => {
    setError(null);

    // Validar overlap apenas se dia/horas estão a ser alterados
    if (payload.dayName && payload.startTime && payload.endTime) {
      if (hasOverlap(schedule, payload.dayName, payload.startTime, payload.endTime, id)) {
        throw new Error('Já existe uma aula nesse horário. Os horários não podem sobrepor-se.');
      }
    }

    const updated = await updateScheduleSlot(id, payload);
    setSchedule((prev) => sortSlots(prev.map((s) => (s.id === id ? updated : s))));
    return updated;
  }, [schedule]);

  // ── Apagar slot ───────────────────────────────────────────────────────────────
  const removeScheduleSlot = useCallback(async (id: string): Promise<void> => {
    setError(null);
    await deleteScheduleSlot(id);
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const refresh    = useCallback(async () => { await load(); }, [load]);
  const clearError = useCallback(() => setError(null), []);

  return {
    schedule,
    isLoading,
    error,
    addScheduleSlot,
    editScheduleSlot,
    removeScheduleSlot,
    checkOverlap,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('sobrep') || m.includes('já tens uma aula') || m.includes('término') || m.includes('inválido')) return msg;
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch')) {
    return 'Sem ligação ao servidor. Verifica a tua internet.';
  }
  if (m.includes('permission') || m.includes('rls') || m.includes('policy')) {
    return 'Não tens permissão para realizar esta acção.';
  }
  if (m.includes('jwt') || m.includes('token') || m.includes('session')) {
    return 'A tua sessão expirou. Inicia sessão novamente.';
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
