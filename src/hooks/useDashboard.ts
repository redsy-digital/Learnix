/**
 * useDashboard.ts
 *
 * Hook dedicado ao Dashboard.
 * Agrega dados de múltiplos hooks (subjects, contents, evaluations)
 * e computa as métricas derivadas necessárias.
 *
 * Princípios:
 *  - Nunca recalcular o que a VIEW subject_stats já calcula (average, performance)
 *  - Datas sempre dinâmicas — nunca hardcoded
 *  - Um único ponto de verdade para os dados do Dashboard
 */

import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { Subject, ContentRecord, Evaluation } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  // Saudação
  greeting: string;          // "Bom dia", "Boa tarde", "Boa noite"
  userName: string;
  streak: number;

  // Data actual
  todayLabel: string;        // "Segunda-feira, 28 de Junho de 2026"
  todayDayName: string;      // "Segunda" (para filtrar horário)

  // Cartões principais
  overallAverage: string;    // "15.4"
  overallPerformance: number;// 77
  totalSubjects: number;
  totalContents: number;
  totalEvaluations: number;

  // Melhor e pior disciplina (via subject_stats)
  bestSubject: Subject | null;
  worstSubject: Subject | null;

  // Conteúdos recentes (até 5)
  recentContents: ContentRecord[];

  // Avaliações recentes (até 3, mais recentes)
  recentEvaluations: Evaluation[];

  // Gráfico
  chartData: { name: string; Nota: number; color: string }[];

  // Horário de hoje
  todaySchedule: ReturnType<typeof useApp>['schedule'];

  // Metas
  activeGoalsCount: number;
  avgGoalProgress: number;  // 0-100

  // Estados de loading
  isLoading: boolean;
  hasData: boolean;
}

// ─── Helpers de data ──────────────────────────────────────────────────────────

const PT_WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const PT_MONTHS   = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatTodayLabel(date: Date): string {
  const weekday = PT_WEEKDAYS[date.getDay()];
  const day     = date.getDate();
  const month   = PT_MONTHS[date.getMonth()];
  const year    = date.getFullYear();
  return `${weekday}-feira, ${day} de ${month} de ${year}`;
}

function getTodayDayName(date: Date): string {
  // Mapeia getDay() (0=Dom...6=Sáb) para o nome PT usado no schedule mock
  return PT_WEEKDAYS[date.getDay()];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardMetrics {
  const { profile } = useAuth();
  const {
    subjects, subjectsLoading,
    contents, contentsLoading,
    evaluations, evaluationsLoading,
    schedule, scheduleLoading,
    goals, goalsLoading,
    user,
  } = useApp();

  const isLoading = subjectsLoading || contentsLoading || evaluationsLoading || scheduleLoading || goalsLoading;

  // ── Data actual (calculada uma vez por render) ────────────────────────────
  const today       = useMemo(() => new Date(), []);
  const todayLabel  = useMemo(() => formatTodayLabel(today), [today]);
  const todayDayName = useMemo(() => getTodayDayName(today), [today]);
  const greeting    = useMemo(() => getGreeting(), []);

  // ── Disciplinas com avaliações (base para métricas) ───────────────────────
  // Usa os valores calculados pela VIEW subject_stats — nunca recalcula
  const subjectsWithEvals = useMemo(
    () => subjects.filter(s => s.evaluationsCount > 0),
    [subjects]
  );

  // ── Média geral (média das médias das disciplinas com avaliações) ─────────
  const overallAverage = useMemo(() => {
    if (subjectsWithEvals.length === 0) return '—';
    const sum = subjectsWithEvals.reduce((acc, s) => acc + s.average, 0);
    return (sum / subjectsWithEvals.length).toFixed(1);
  }, [subjectsWithEvals]);

  // ── Rendimento médio geral ────────────────────────────────────────────────
  const overallPerformance = useMemo(() => {
    if (subjectsWithEvals.length === 0) return 0;
    const sum = subjectsWithEvals.reduce((acc, s) => acc + s.performance, 0);
    return Math.round(sum / subjectsWithEvals.length);
  }, [subjectsWithEvals]);

  // ── Melhor e pior disciplina (valores da VIEW subject_stats) ─────────────
  const { bestSubject, worstSubject } = useMemo(() => {
    if (subjectsWithEvals.length === 0) {
      return { bestSubject: null, worstSubject: null };
    }
    const sorted = [...subjectsWithEvals].sort((a, b) => b.average - a.average);
    return {
      bestSubject:  sorted[0],
      worstSubject: sorted[sorted.length - 1],
    };
  }, [subjectsWithEvals]);

  // ── Últimos 5 conteúdos (já vêm ordenados por data DESC do Supabase) ─────
  const recentContents = useMemo(() => contents.slice(0, 5), [contents]);

  // ── Últimas 3 avaliações (já vêm ordenadas por data DESC do Supabase) ────
  const recentEvaluations = useMemo(() => evaluations.slice(0, 3), [evaluations]);

  // ── Dados para o gráfico (todas as disciplinas com cor) ──────────────────
  const chartData = useMemo(
    () => subjects.map(s => ({ name: s.name, Nota: s.average, color: s.colorHex })),
    [subjects]
  );

  // ── Horário de hoje ────────────────────────────────────────────────────────
  const todaySchedule = useMemo(
    () => schedule.filter(slot => slot.day === todayDayName),
    [schedule, todayDayName]
  );

  // ── Streak ────────────────────────────────────────────────────────────────
  const streak = profile?.streak ?? user.streak ?? 0;

  // ── hasData: tem pelo menos disciplinas carregadas ────────────────────────
  const hasData = !isLoading && subjects.length > 0;

  // ── Métricas de metas ─────────────────────────────────────────────────────
  const activeGoals    = useMemo(() => goals.filter(g => !g.isCompleted), [goals]);
  const activeGoalsCount = activeGoals.length;
  const avgGoalProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    const sum = activeGoals.reduce(
      (acc, g) => acc + Math.min((g.current / g.target) * 100, 100), 0
    );
    return Math.round(sum / activeGoals.length);
  }, [activeGoals]);

  return {
    greeting,
    userName:          profile?.name || user.name || 'Estudante',
    streak,
    todayLabel,
    todayDayName,
    overallAverage,
    overallPerformance,
    totalSubjects:     subjects.length,
    totalContents:     contents.length,
    totalEvaluations:  evaluations.length,
    bestSubject,
    worstSubject,
    recentContents,
    recentEvaluations,
    chartData,
    todaySchedule,
    activeGoalsCount,
    avgGoalProgress,
    isLoading,
    hasData,
  };
}
