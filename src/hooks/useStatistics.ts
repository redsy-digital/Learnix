/**
 * useStatistics.ts
 *
 * Hook dedicado à página de Estatísticas.
 * Opera exclusivamente sobre dados já carregados no AppContext —
 * zero queries adicionais ao Supabase.
 *
 * Todos os cálculos são memoizados com useMemo para evitar
 * recomputações desnecessárias em cada render.
 */

import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  computeOverviewStats,
  computeSubjectStats,
  computeGradeEvolution,
  computeContentsByMonth,
  computeContentsBySubject,
  computeGoalStats,
  computeInsights,
  type OverviewStats,
  type SubjectStat,
  type GradePoint,
  type ContentsByMonth,
  type ContentsBySubject,
  type GoalStats,
  type Insight,
  type PeriodFilter,
} from '../services/statisticsService';

// ─── Tipos expostos ───────────────────────────────────────────────────────────

export interface UseStatisticsReturn {
  // Filtros controlados pelo hook
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  filterSubjectId: string;
  setFilterSubjectId: (id: string) => void;

  // Dados memoizados
  overview: OverviewStats;
  subjectStats: SubjectStat[];
  gradeEvolution: GradePoint[];
  contentsByMonth: ContentsByMonth[];
  contentsBySubject: ContentsBySubject[];
  goalStats: GoalStats;
  insights: Insight[];

  // Dados brutos necessários na UI
  subjects: import('../types').Subject[];

  // Estados de loading (vindos do AppContext)
  isLoading: boolean;
  hasData: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStatistics(): UseStatisticsReturn {
  const {
    subjects, subjectsLoading,
    contents, contentsLoading,
    evaluations, evaluationsLoading,
    goals, goalsLoading,
  } = useApp();

  const isLoading = subjectsLoading || contentsLoading || evaluationsLoading || goalsLoading;
  const hasData   = !isLoading && (subjects.length > 0 || contents.length > 0 || evaluations.length > 0);

  // ── Filtros de UI ─────────────────────────────────────────────────────────
  const [period, setPeriod]               = useState<PeriodFilter>('all');
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  // ── Computações memoizadas ────────────────────────────────────────────────

  const overview = useMemo(
    () => computeOverviewStats(subjects, contents, evaluations, goals),
    [subjects, contents, evaluations, goals]
  );

  const subjectStats = useMemo(
    () => computeSubjectStats(subjects),
    [subjects]
  );

  const gradeEvolution = useMemo(
    () => computeGradeEvolution(evaluations, subjects, period, filterSubjectId),
    [evaluations, subjects, period, filterSubjectId]
  );

  const contentsByMonth = useMemo(
    () => computeContentsByMonth(contents),
    [contents]
  );

  const contentsBySubject = useMemo(
    () => computeContentsBySubject(contents, subjects),
    [contents, subjects]
  );

  const goalStats = useMemo(
    () => computeGoalStats(goals),
    [goals]
  );

  const insights = useMemo(
    () => computeInsights(subjects, contents, evaluations, goals),
    [subjects, contents, evaluations, goals]
  );

  return {
    period, setPeriod,
    filterSubjectId, setFilterSubjectId,
    overview,
    subjectStats,
    gradeEvolution,
    contentsByMonth,
    contentsBySubject,
    goalStats,
    insights,
    subjects,
    isLoading,
    hasData,
  };
}
