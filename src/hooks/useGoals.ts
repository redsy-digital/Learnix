/**
 * useGoals.ts
 *
 * Hook que centraliza o estado reactivo das metas académicas.
 * Consome o goalsService (que fala com o Supabase).
 *
 * Funcionalidade especial: sincronização automática de progresso.
 * Quando os dados de subjects/contents/evaluations mudam (após addContent,
 * addEvaluation, etc.), este hook recalcula o progresso das metas que
 * podem ser inferidas automaticamente e actualiza o DB.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AcademicGoal } from '../types';
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  toggleGoalCompletion,
  updateGoalProgress,
  inferAutoProgress,
  type CreateGoalPayload,
  type UpdateGoalPayload,
  type AutoProgressContext,
} from '../services/goalsService';
import { useAuth } from '../context/AuthContext';

// ─── Tipos expostos ───────────────────────────────────────────────────────────

export interface UseGoalsReturn {
  goals: AcademicGoal[];
  isLoading: boolean;
  error: string | null;

  addGoal:              (payload: CreateGoalPayload) => Promise<AcademicGoal>;
  editGoal:             (id: string, payload: UpdateGoalPayload) => Promise<AcademicGoal>;
  removeGoal:           (id: string) => Promise<void>;
  completeGoal:         (id: string, isCurrentlyCompleted: boolean) => Promise<void>;
  setGoalProgress:      (id: string, current: number) => Promise<void>;

  /** Recalcula e sincroniza progressos automáticos com base nos dados actuais */
  syncAutoProgress:     (ctx: AutoProgressContext) => Promise<void>;

  refresh:    () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGoals(): UseGoalsReturn {
  const { isLoggedIn } = useAuth();

  const [goals, setGoals]         = useState<AcademicGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Ref para evitar sincronizações simultâneas
  const syncingRef = useRef(false);

  // ── Carregar metas ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGoals();
      setGoals(data);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // ── Criar ─────────────────────────────────────────────────────────────────
  const addGoal = useCallback(async (payload: CreateGoalPayload): Promise<AcademicGoal> => {
    setError(null);
    const created = await createGoal(payload);
    setGoals((prev) => [created, ...prev]);
    return created;
  }, []);

  // ── Editar ────────────────────────────────────────────────────────────────
  const editGoal = useCallback(async (
    id: string, payload: UpdateGoalPayload
  ): Promise<AcademicGoal> => {
    setError(null);
    const updated = await updateGoal(id, payload);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  // ── Apagar ────────────────────────────────────────────────────────────────
  const removeGoal = useCallback(async (id: string): Promise<void> => {
    setError(null);
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // ── Concluir / Reabrir ────────────────────────────────────────────────────
  const completeGoal = useCallback(async (
    id: string, isCurrentlyCompleted: boolean
  ): Promise<void> => {
    setError(null);
    const updated = await toggleGoalCompletion(id, isCurrentlyCompleted);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }, []);

  // ── Progresso manual ──────────────────────────────────────────────────────
  const setGoalProgress = useCallback(async (id: string, current: number): Promise<void> => {
    setError(null);
    const updated = await updateGoalProgress(id, current);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }, []);

  // ── Sincronização automática de progresso ─────────────────────────────────
  /**
   * Para cada meta activa, tenta inferir o progresso real a partir dos
   * dados do sistema. Se o valor calculado for diferente do armazenado,
   * actualiza o DB (silenciosamente — sem bloquear a UI).
   */
  const syncAutoProgress = useCallback(async (ctx: AutoProgressContext): Promise<void> => {
    if (syncingRef.current || goals.length === 0) return;
    syncingRef.current = true;

    try {
      const activeGoals = goals.filter((g) => !g.isCompleted);
      const updates: Promise<AcademicGoal>[] = [];

      for (const goal of activeGoals) {
        const inferred = inferAutoProgress(goal, ctx);
        // Só actualiza se o valor calculado for diferente (evita writes desnecessários)
        if (inferred !== null && Math.abs(inferred - goal.current) > 0.05) {
          updates.push(updateGoalProgress(goal.id, inferred));
        }
      }

      if (updates.length === 0) return;

      const updated = await Promise.all(updates);
      setGoals((prev) =>
        prev.map((g) => {
          const u = updated.find((u) => u.id === g.id);
          return u ?? g;
        })
      );
    } catch {
      // Silencioso — não bloqueia a UI por falha de sync
    } finally {
      syncingRef.current = false;
    }
  }, [goals]);

  const refresh    = useCallback(async () => { await load(); }, [load]);
  const clearError = useCallback(() => setError(null), []);

  return {
    goals,
    isLoading,
    error,
    addGoal,
    editGoal,
    removeGoal,
    completeGoal,
    setGoalProgress,
    syncAutoProgress,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('valor alvo') || m.includes('sessão')) return msg;
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch')) {
    return 'Sem ligação ao servidor. Verifica a tua internet.';
  }
  if (m.includes('permission') || m.includes('rls') || m.includes('policy')) {
    return 'Não tens permissão para realizar esta acção.';
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
