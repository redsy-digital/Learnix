/**
 * useNotifications.ts
 *
 * Hook que centraliza o estado reactivo das notificações.
 * Consome o notificationsService (que fala com o Supabase).
 *
 * Responsabilidades:
 *  - Carregar notificações reais do DB
 *  - CRUD: marcar lida, marcar todas lidas, eliminar, eliminar lidas
 *  - Disparar geração automática de notificações quando os dados mudam
 *  - Anti-duplicação: só dispara geração se os dados relevantes mudaram
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppNotification, Subject, ContentRecord, ScheduleSlot, AcademicGoal, Evaluation } from '../types';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  generateSmartNotifications,
  type NotifGenerationContext,
} from '../services/notificationsService';
import { useAuth } from '../context/AuthContext';

// ─── Tipos expostos ───────────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount:   number;
  isLoading:     boolean;
  error:         string | null;

  markRead:           (id: string) => Promise<void>;
  markAllRead:        () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  removeAllRead:      () => Promise<void>;

  refresh:    () => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(
  ctx: NotifGenerationContext
): UseNotificationsReturn {
  const { isLoggedIn, user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Ref para evitar gerações simultâneas
  const generatingRef = useRef(false);
  // Ref para rastrear o "fingerprint" dos dados relevantes e evitar re-gerar sem mudança
  const lastFingerprintRef = useRef('');

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Carregar notificações ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : ''));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { load(); }, [load]);

  // ── Geração automática (dispara quando dados mudam) ───────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    // Fingerprint dos dados relevantes para evitar re-gerar sem mudança real
    const fingerprint = [
      ctx.contents.length,
      ctx.evaluations.length,
      ctx.schedule.length,
      ctx.goals.filter(g => !g.isCompleted).length,
      ctx.subjects.filter(s => s.performance < 60).length,
      new Date().toISOString().split('T')[0], // muda a cada dia
      new Date().getHours() >= 14 ? 'pm' : 'am', // muda a tarde (para regra sem-conteudo)
    ].join('|');

    if (fingerprint === lastFingerprintRef.current) return;
    if (generatingRef.current) return;

    // Só gerar se tiver pelo menos algum dado para avaliar
    if (ctx.subjects.length === 0 && ctx.contents.length === 0) return;

    generatingRef.current = true;
    lastFingerprintRef.current = fingerprint;

    generateSmartNotifications(user.id, ctx, notifications)
      .then((newNotifs) => {
        if (newNotifs.length > 0) {
          // Adicionar novas notificações no topo da lista
          setNotifications(prev => [...newNotifs, ...prev]);
        }
      })
      .catch(() => { /* silencioso — não bloqueia a UI */ })
      .finally(() => { generatingRef.current = false; });
  }, [
    isLoggedIn, user?.id,
    ctx.contents.length,
    ctx.evaluations.length,
    ctx.schedule.length,
    ctx.goals.length,
    ctx.subjects.length,
  ]);

  // ── Marcar como lida ──────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string): Promise<void> => {
    // Optimistic update: actualizar UI imediatamente
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await markAsRead(id);
    } catch {
      // Reverter em caso de erro
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
    }
  }, []);

  // ── Marcar todas como lidas ───────────────────────────────────────────────
  const markAllRead = useCallback(async (): Promise<void> => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllAsRead();
    } catch {
      // Re-carregar em caso de erro
      await load();
    }
  }, [load]);

  // ── Eliminar notificação ──────────────────────────────────────────────────
  const removeNotification = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotification(id);
    } catch {
      await load(); // Re-carregar se falhar
    }
  }, [load]);

  // ── Eliminar todas as lidas ───────────────────────────────────────────────
  const removeAllRead = useCallback(async (): Promise<void> => {
    setNotifications(prev => prev.filter(n => !n.read));
    try {
      await deleteAllRead();
    } catch {
      await load();
    }
  }, [load]);

  const refresh    = useCallback(async () => { await load(); }, [load]);
  const clearError = useCallback(() => setError(null), []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    removeNotification,
    removeAllRead,
    refresh,
    clearError,
  };
}

// ─── Traduções de erro ────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('fetch') || m.includes('network')) {
    return 'Sem ligação ao servidor. Verifica a tua internet.';
  }
  if (m.includes('permission') || m.includes('rls')) {
    return 'Não tens permissão para esta acção.';
  }
  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
