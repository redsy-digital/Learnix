/**
 * useSubjects.ts
 *
 * Hook que centraliza o estado reactivo das disciplinas.
 * Consome o subjectsService (que fala com o Supabase).
 * Expõe: dados, loading, erro, e todas as operações CRUD.
 *
 * Utilizado pelo AppContext para fornecer subjects ao resto da app.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Subject, CreateSubjectPayload, UpdateSubjectPayload } from '../types';
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  checkSubjectDependencies,
} from '../services/subjectsService';
import { useAuth } from '../context/AuthContext';

// ─── Tipos expostos pelo hook ─────────────────────────────────────────────────

export interface SubjectDependencies {
  contents: number;
  evaluations: number;
  scheduleSlots: number;
}

export interface UseSubjectsReturn {
  // Estado
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;

  // CRUD
  addSubject:    (payload: CreateSubjectPayload) => Promise<Subject>;
  editSubject:   (id: string, payload: UpdateSubjectPayload) => Promise<Subject>;
  removeSubject: (id: string) => Promise<void>;
  getDependencies: (id: string) => Promise<SubjectDependencies>;

  // Utilitários
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubjects(): UseSubjectsReturn {
  const { isLoggedIn } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Carregar disciplinas ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSubjects();
      setSubjects(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar disciplinas.';
      setError(translateError(msg));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  // Carregar ao montar e quando a sessão mudar
  useEffect(() => {
    load();
  }, [load]);

  // ── Criar disciplina ────────────────────────────────────────────────────────
  const addSubject = useCallback(async (payload: CreateSubjectPayload): Promise<Subject> => {
    setError(null);
    const newSubject = await createSubject(payload);
    // Inserir na lista mantendo ordem alfabética
    setSubjects((prev) =>
      [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    );
    return newSubject;
  }, []);

  // ── Editar disciplina ───────────────────────────────────────────────────────
  const editSubject = useCallback(
    async (id: string, payload: UpdateSubjectPayload): Promise<Subject> => {
      setError(null);
      const updated = await updateSubject(id, payload);
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
      );
      return updated;
    },
    []
  );

  // ── Apagar disciplina ───────────────────────────────────────────────────────
  const removeSubject = useCallback(async (id: string): Promise<void> => {
    setError(null);
    await deleteSubject(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Verificar dependências antes de apagar ──────────────────────────────────
  const getDependencies = useCallback(
    async (id: string): Promise<SubjectDependencies> => {
      return checkSubjectDependencies(id);
    },
    []
  );

  // ── Refresh manual ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const clearError = useCallback(() => setError(null), []);

  return {
    subjects,
    isLoading,
    error,
    addSubject,
    editSubject,
    removeSubject,
    getDependencies,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('já tens uma disciplina')) return msg; // já traduzido no service
  if (m.includes('fetch') || m.includes('network') || m.includes('failed')) {
    return 'Sem ligação ao servidor. Verifica a tua internet.';
  }
  if (m.includes('permission') || m.includes('rls') || m.includes('policy')) {
    return 'Não tens permissão para realizar esta acção.';
  }
  if (m.includes('jwt') || m.includes('auth') || m.includes('token')) {
    return 'A tua sessão expirou. Inicia sessão novamente.';
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
