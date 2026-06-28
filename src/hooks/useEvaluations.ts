/**
 * useEvaluations.ts
 *
 * Hook que centraliza o estado reactivo das avaliações escolares.
 * Consome o evaluationsService (que fala com o Supabase).
 *
 * Após qualquer mutação (criar, editar, apagar), a VIEW subject_stats
 * do Supabase reflecte automaticamente as novas médias.
 * O hook sinaliza refreshSubjects via callback para que o AppContext
 * actualize os subjects com os novos valores calculados.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Evaluation } from '../types';
import {
  fetchEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  type CreateEvaluationPayload,
  type UpdateEvaluationPayload,
} from '../services/evaluationsService';
import { useAuth } from '../context/AuthContext';

// ─── Tipos expostos pelo hook ─────────────────────────────────────────────────

export interface UseEvaluationsReturn {
  evaluations: Evaluation[];
  isLoading: boolean;
  error: string | null;

  addEvaluation:    (payload: CreateEvaluationPayload) => Promise<Evaluation>;
  editEvaluation:   (id: string, payload: UpdateEvaluationPayload) => Promise<Evaluation>;
  removeEvaluation: (id: string) => Promise<void>;

  refresh:    () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEvaluations(
  onMutate?: () => void   // callback para o AppContext refrescar subjects após mutação
): UseEvaluationsReturn {
  const { isLoggedIn } = useAuth();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ── Carregar avaliações ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEvaluations();
      setEvaluations(data);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // ── Criar ───────────────────────────────────────────────────────────────────
  const addEvaluation = useCallback(async (
    payload: CreateEvaluationPayload
  ): Promise<Evaluation> => {
    setError(null);
    const created = await createEvaluation(payload);
    setEvaluations((prev) =>
      [created, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );
    // Notificar AppContext para refrescar subject_stats (médias actualizadas)
    onMutate?.();
    return created;
  }, [onMutate]);

  // ── Editar ──────────────────────────────────────────────────────────────────
  const editEvaluation = useCallback(async (
    id: string,
    payload: UpdateEvaluationPayload
  ): Promise<Evaluation> => {
    setError(null);
    const updated = await updateEvaluation(id, payload);
    setEvaluations((prev) =>
      prev.map((e) => (e.id === id ? updated : e))
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    onMutate?.();
    return updated;
  }, [onMutate]);

  // ── Apagar ──────────────────────────────────────────────────────────────────
  const removeEvaluation = useCallback(async (id: string): Promise<void> => {
    setError(null);
    await deleteEvaluation(id);
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
    onMutate?.();
  }, [onMutate]);

  const refresh    = useCallback(async () => { await load(); }, [load]);
  const clearError = useCallback(() => setError(null), []);

  return {
    evaluations,
    isLoading,
    error,
    addEvaluation,
    editEvaluation,
    removeEvaluation,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('nota obtida') || m.includes('valor máximo') || m.includes('negativa')) return msg;
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
