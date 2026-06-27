/**
 * useContents.ts
 *
 * Hook que centraliza o estado reactivo dos conteúdos estudados.
 * Consome o contentsService (que fala com o Supabase).
 * Expõe: dados, loading, erro, CRUD completo e upload de foto.
 *
 * Utilizado pelo AppContext para fornecer contents ao resto da app.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ContentRecord } from '../types';
import {
  fetchContents,
  createContent,
  updateContent,
  deleteContent,
  uploadContentPhoto,
  getPhotoSignedUrl,
  type CreateContentPayload,
  type UpdateContentPayload,
} from '../services/contentsService';
import { useAuth } from '../context/AuthContext';

// ─── Tipos expostos pelo hook ─────────────────────────────────────────────────

export interface UseContentsReturn {
  // Estado
  contents: ContentRecord[];
  isLoading: boolean;
  error: string | null;

  // CRUD
  addContent:    (payload: CreateContentPayload) => Promise<ContentRecord>;
  editContent:   (id: string, payload: UpdateContentPayload) => Promise<ContentRecord>;
  removeContent: (id: string, photoPath?: string) => Promise<void>;

  // Storage
  uploadPhoto:      (file: File) => Promise<string>;
  getSignedPhotoUrl:(photoPath: string) => Promise<string>;

  // Utilitários
  refresh:    () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContents(): UseContentsReturn {
  const { isLoggedIn, user } = useAuth();

  const [contents, setContents] = useState<ContentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Carregar conteúdos ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchContents();
      setContents(data);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Criar conteúdo ──────────────────────────────────────────────────────────
  const addContent = useCallback(async (
    payload: CreateContentPayload
  ): Promise<ContentRecord> => {
    setError(null);
    const newRecord = await createContent(payload);
    // Inserir no topo da lista (mais recente primeiro)
    setContents((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  // ── Editar conteúdo ─────────────────────────────────────────────────────────
  const editContent = useCallback(async (
    id: string,
    payload: UpdateContentPayload
  ): Promise<ContentRecord> => {
    setError(null);
    const updated = await updateContent(id, payload);
    setContents((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  // ── Apagar conteúdo ─────────────────────────────────────────────────────────
  const removeContent = useCallback(async (
    id: string,
    photoPath?: string
  ): Promise<void> => {
    setError(null);
    await deleteContent(id, photoPath);
    setContents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Upload de foto ──────────────────────────────────────────────────────────
  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Sessão inválida.');
    return uploadContentPhoto(user.id, file);
  }, [user?.id]);

  // ── URL assinada para visualizar foto ──────────────────────────────────────
  const getSignedPhotoUrl = useCallback(async (
    photoPath: string
  ): Promise<string> => {
    return getPhotoSignedUrl(photoPath);
  }, []);

  // ── Refresh manual ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => { await load(); }, [load]);
  const clearError = useCallback(() => setError(null), []);

  return {
    contents,
    isLoading,
    error,
    addContent,
    editContent,
    removeContent,
    uploadPhoto,
    getSignedPhotoUrl,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch')) {
    return 'Sem ligação ao servidor. Verifica a tua internet.';
  }
  if (m.includes('permission') || m.includes('rls') || m.includes('policy')) {
    return 'Não tens permissão para realizar esta acção.';
  }
  if (m.includes('jwt') || m.includes('token') || m.includes('session')) {
    return 'A tua sessão expirou. Inicia sessão novamente.';
  }
  if (m.includes('upload') || m.includes('storage')) {
    return 'Erro no upload da imagem. Verifica o tamanho e formato do ficheiro.';
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
