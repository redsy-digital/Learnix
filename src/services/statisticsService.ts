/**
 * statisticsService.ts
 *
 * Lógica de agregação e análise para a página de Estatísticas.
 * NÃO faz queries ao Supabase directamente — opera sobre os dados
 * já carregados no AppContext (subjects, contents, evaluations, goals).
 *
 * Isto evita queries duplicadas e respeita o princípio de
 * "reutilizar dados já carregados no AppContext".
 *
 * Todas as médias e rendimentos vêm da VIEW subject_stats
 * (via subjects do AppContext) — nunca recalculados aqui.
 */

import type { Subject, ContentRecord, Evaluation, AcademicGoal } from '../types';

// ─── Tipos de output ──────────────────────────────────────────────────────────

export interface OverviewStats {
  totalSubjects: number;
  totalContents: number;
  totalEvaluations: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallAverage: string;        // "15.4" ou "—"
  overallPerformance: number;    // 0-100
  avgWeeklyContents: string;     // "2.3"
  studyDays: number;             // dias distintos com pelo menos 1 conteúdo
}

export interface SubjectStat {
  id: string;
  name: string;
  colorHex: string;
  average: number;
  performance: number;
  contentsCount: number;
  evaluationsCount: number;
}

export interface GradePoint {
  date: string;        // formato display "Jun/15"
  isoDate: string;     // "2026-06-15" para ordenação
  Nota: number;
  Materia: string;
  subjectColor: string;
}

export interface ContentsByMonth {
  month: string;       // "Jan", "Fev", …
  yearMonth: string;   // "2026-01" para ordenação
  total: number;
}

export interface ContentsBySubject {
  name: string;
  total: number;
  color: string;
}

export interface GoalStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;   // 0-100
  avgProgress: number;      // 0-100
}

export interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  body: string;
}

export type PeriodFilter = '30d' | '90d' | 'year' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PT_MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                         'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function isoToDisplay(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${PT_MONTHS_SHORT[parseInt(month) - 1]}/${day}`;
}

function getISOYearMonth(isoDate: string): string {
  return isoDate.substring(0, 7); // "2026-06"
}

function monthLabel(yearMonth: string): string {
  const [, month] = yearMonth.split('-');
  return PT_MONTHS_SHORT[parseInt(month) - 1];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function startOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

// ─── Filtro de período ────────────────────────────────────────────────────────

export function filterByPeriod(
  evaluations: Evaluation[],
  period: PeriodFilter
): Evaluation[] {
  if (period === 'all') return evaluations;
  const cutoff =
    period === '30d'  ? daysAgo(30)  :
    period === '90d'  ? daysAgo(90)  :
    startOfYear();
  return evaluations.filter(e => e.date >= cutoff);
}

// ─── Estatísticas gerais ──────────────────────────────────────────────────────

export function computeOverviewStats(
  subjects: Subject[],
  contents: ContentRecord[],
  evaluations: Evaluation[],
  goals: AcademicGoal[]
): OverviewStats {
  const subjectsWithEvals = subjects.filter(s => s.evaluationsCount > 0);

  // Média geral — usa valores da VIEW subject_stats
  let overallAverage = '—';
  let overallPerformance = 0;
  if (subjectsWithEvals.length > 0) {
    const avgSum  = subjectsWithEvals.reduce((a, s) => a + s.average, 0);
    const perfSum = subjectsWithEvals.reduce((a, s) => a + s.performance, 0);
    overallAverage    = (avgSum / subjectsWithEvals.length).toFixed(1);
    overallPerformance = Math.round(perfSum / subjectsWithEvals.length);
  }

  // Dias distintos com pelo menos 1 conteúdo
  const studyDays = new Set(contents.map(c => c.date)).size;

  // Média semanal de conteúdos (baseada nos últimos 30 dias ou total)
  let avgWeeklyContents = '0';
  if (contents.length > 0) {
    const dates = contents.map(c => c.date).sort();
    const firstDate = new Date(dates[0]);
    const lastDate  = new Date(dates[dates.length - 1]);
    const diffDays  = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeks     = Math.max(1, diffDays / 7);
    avgWeeklyContents = (contents.length / weeks).toFixed(1);
  }

  const activeGoals    = goals.filter(g => !g.isCompleted).length;
  const completedGoals = goals.filter(g => g.isCompleted).length;

  return {
    totalSubjects:    subjects.length,
    totalContents:    contents.length,
    totalEvaluations: evaluations.length,
    totalGoals:       goals.length,
    activeGoals,
    completedGoals,
    overallAverage,
    overallPerformance,
    avgWeeklyContents,
    studyDays,
  };
}

// ─── Estatísticas por disciplina ──────────────────────────────────────────────

export function computeSubjectStats(subjects: Subject[]): SubjectStat[] {
  return [...subjects]
    .sort((a, b) => b.average - a.average)
    .map(s => ({
      id:               s.id,
      name:             s.name,
      colorHex:         s.colorHex,
      average:          s.average,
      performance:      s.performance,
      contentsCount:    s.contentsCount,
      evaluationsCount: s.evaluationsCount,
    }));
}

// ─── Evolução de notas (gráfico de área) ─────────────────────────────────────

export function computeGradeEvolution(
  evaluations: Evaluation[],
  subjects: Subject[],
  period: PeriodFilter,
  filterSubjectId: string
): GradePoint[] {
  let filtered = filterByPeriod(evaluations, period);
  if (filterSubjectId !== 'all') {
    filtered = filtered.filter(e => e.subjectId === filterSubjectId);
  }

  // Ordenar cronologicamente (mais antigas primeiro para o gráfico)
  filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  // Limitar a 20 pontos para não sobrecarregar o gráfico
  const limited = filtered.slice(-20);

  return limited.map(e => {
    const sub = subjects.find(s => s.id === e.subjectId);
    return {
      date:         isoToDisplay(e.date),
      isoDate:      e.date,
      Nota:         e.gradeObtained,
      Materia:      e.subjectName,
      subjectColor: sub?.colorHex ?? '#4F46E5',
    };
  });
}

// ─── Conteúdos por mês ───────────────────────────────────────────────────────

export function computeContentsByMonth(contents: ContentRecord[]): ContentsByMonth[] {
  const counts: Record<string, number> = {};
  for (const c of contents) {
    const ym = getISOYearMonth(c.date);
    counts[ym] = (counts[ym] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, total]) => ({ month: monthLabel(ym), yearMonth: ym, total }));
}

// ─── Conteúdos por disciplina ─────────────────────────────────────────────────

export function computeContentsBySubject(
  contents: ContentRecord[],
  subjects: Subject[]
): ContentsBySubject[] {
  const counts: Record<string, number> = {};
  for (const c of contents) {
    counts[c.subjectId] = (counts[c.subjectId] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, total]) => {
      const sub = subjects.find(s => s.id === id);
      return {
        name:  sub?.name ?? 'Sem disciplina',
        total,
        color: sub?.colorHex ?? '#94a3b8',
      };
    })
    .sort((a, b) => b.total - a.total);
}

// ─── Estatísticas de metas ────────────────────────────────────────────────────

export function computeGoalStats(goals: AcademicGoal[]): GoalStats {
  const total     = goals.length;
  const completed = goals.filter(g => g.isCompleted).length;
  const active    = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const activeList = goals.filter(g => !g.isCompleted);
  const avgProgress = activeList.length > 0
    ? Math.round(activeList.reduce((sum, g) => sum + Math.min((g.current / g.target) * 100, 100), 0) / activeList.length)
    : 0;

  return { total, active, completed, completionRate, avgProgress };
}

// ─── Insights inteligentes (sem IA) ──────────────────────────────────────────

export function computeInsights(
  subjects: Subject[],
  contents: ContentRecord[],
  evaluations: Evaluation[],
  goals: AcademicGoal[]
): Insight[] {
  const insights: Insight[] = [];
  const subjectsWithEvals = subjects.filter(s => s.evaluationsCount > 0);

  if (subjects.length === 0) {
    insights.push({
      type: 'info',
      title: 'Começa por criar disciplinas',
      body: 'Ainda não tens disciplinas registadas. Cria as tuas disciplinas para começar a gerar insights personalizados.',
    });
    return insights;
  }

  // ── Melhor disciplina ─────────────────────────────────────────────────────
  if (subjectsWithEvals.length > 0) {
    const best = [...subjectsWithEvals].sort((a, b) => b.average - a.average)[0];
    insights.push({
      type: 'success',
      title: `🏆 Melhor disciplina: ${best.name}`,
      body: `A tua média em ${best.name} é de ${best.average} valores, com um rendimento de ${best.performance}%. Mantém este nível!`,
    });
  }

  // ── Disciplina que precisa de atenção ─────────────────────────────────────
  if (subjectsWithEvals.length > 1) {
    const worst = [...subjectsWithEvals].sort((a, b) => a.average - b.average)[0];
    if (worst.average < 14) {
      insights.push({
        type: 'warning',
        title: `⚠️ ${worst.name} precisa de atenção`,
        body: `A tua média em ${worst.name} está em ${worst.average} valores. Dedica mais tempo de revisão a esta disciplina antes da próxima avaliação.`,
      });
    }
  }

  // ── Média geral ───────────────────────────────────────────────────────────
  if (subjectsWithEvals.length > 0) {
    const avgSum = subjectsWithEvals.reduce((a, s) => a + s.average, 0);
    const overall = (avgSum / subjectsWithEvals.length).toFixed(1);
    const perfSum = subjectsWithEvals.reduce((a, s) => a + s.performance, 0);
    const perf = Math.round(perfSum / subjectsWithEvals.length);
    insights.push({
      type: perf >= 75 ? 'success' : perf >= 50 ? 'info' : 'warning',
      title: `📊 Média geral: ${overall} valores (${perf}% rendimento)`,
      body: perf >= 75
        ? 'O teu rendimento académico geral é excelente. Continua neste ritmo!'
        : perf >= 50
        ? 'O teu rendimento está em linha com a média. Há espaço para crescer!'
        : 'O teu rendimento está abaixo do esperado. Considera aumentar o tempo de estudo diário.',
    });
  }

  // ── Frequência de estudo ──────────────────────────────────────────────────
  if (contents.length > 0) {
    const studyDays = new Set(contents.map(c => c.date)).size;
    const dates     = contents.map(c => c.date).sort();
    const firstDate = new Date(dates[0]);
    const lastDate  = new Date(dates[dates.length - 1]);
    const diffDays  = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000*60*60*24)));
    const weeks     = Math.max(1, diffDays / 7);
    const weekly    = (contents.length / weeks).toFixed(1);

    insights.push({
      type: parseFloat(weekly) >= 3 ? 'success' : 'tip',
      title: `📚 ${studyDays} dias de estudo registados`,
      body: `Tens uma média de ${weekly} conteúdos por semana. ${
        parseFloat(weekly) >= 5
          ? 'Frequência excelente! Estás bem acima da média de alunos consistentes.'
          : parseFloat(weekly) >= 3
          ? 'Boa frequência! Tenta chegar a 5 conteúdos por semana para maximizares a retenção.'
          : 'Tenta registar pelo menos 3 aulas por semana para criar um hábito de estudo sólido.'
      }`,
    });
  }

  // ── Última avaliação ──────────────────────────────────────────────────────
  if (evaluations.length > 0) {
    const sorted = [...evaluations].sort((a, b) => b.date.localeCompare(a.date));
    const last   = sorted[0];
    const pct    = Math.round((last.gradeObtained / last.maxValue) * 100);
    insights.push({
      type: pct >= 75 ? 'success' : pct >= 50 ? 'info' : 'warning',
      title: `📝 Última avaliação: ${last.subjectName}`,
      body: `Obtiveste ${last.gradeObtained}/${last.maxValue} (${pct}%) em ${last.type} de ${last.subjectName} em ${last.date}.${
        pct < 50 ? ' Recomendamos uma revisão dos conteúdos desta matéria.' : ''
      }`,
    });
  }

  // ── Média das últimas 3 avaliações ────────────────────────────────────────
  if (evaluations.length >= 3) {
    const last3    = [...evaluations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const avg3     = last3.reduce((sum, e) => sum + (e.gradeObtained / e.maxValue) * 20, 0) / 3;
    const allAvg   = subjectsWithEvals.length > 0
      ? subjectsWithEvals.reduce((a, s) => a + s.average, 0) / subjectsWithEvals.length
      : 0;
    const trend    = avg3 > allAvg ? '📈 tendência de subida' : avg3 < allAvg ? '📉 tendência de descida' : '➡️ estável';
    insights.push({
      type: avg3 >= allAvg ? 'success' : 'info',
      title: `Últimas 3 avaliações: média ${avg3.toFixed(1)} (${trend})`,
      body: avg3 > allAvg
        ? `As tuas últimas avaliações estão acima da tua média histórica (${allAvg.toFixed(1)}). Estás a melhorar!`
        : avg3 < allAvg
        ? `As tuas últimas avaliações (${avg3.toFixed(1)}) estão abaixo da tua média histórica (${allAvg.toFixed(1)}). Revê os últimos conteúdos.`
        : 'O teu desempenho recente está estável e alinhado com a tua média histórica.',
    });
  }

  // ── Metas ─────────────────────────────────────────────────────────────────
  const activeGoals = goals.filter(g => !g.isCompleted);
  if (activeGoals.length > 0) {
    const nearComplete = activeGoals.filter(g => (g.current / g.target) >= 0.8);
    if (nearComplete.length > 0) {
      insights.push({
        type: 'tip',
        title: `🎯 ${nearComplete.length} meta${nearComplete.length > 1 ? 's' : ''} quase concluída${nearComplete.length > 1 ? 's' : ''}`,
        body: `"${nearComplete[0].title}" está a ${Math.round((nearComplete[0].current / nearComplete[0].target) * 100)}% de conclusão. Mais um esforço!`,
      });
    }
  }

  // ── Disciplina sem avaliações ─────────────────────────────────────────────
  const noEvals = subjects.filter(s => s.evaluationsCount === 0);
  if (noEvals.length > 0 && subjects.length > noEvals.length) {
    insights.push({
      type: 'tip',
      title: `💡 ${noEvals.length} disciplina${noEvals.length > 1 ? 's' : ''} sem avaliações`,
      body: `${noEvals.map(s => s.name).join(', ')} ainda não têm notas registadas. Adiciona avaliações para acompanhar o teu rendimento completo.`,
    });
  }

  return insights;
}
