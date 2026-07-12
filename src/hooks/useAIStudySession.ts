/**
 * useAIStudySession.ts
 *
 * Hook dedicado à página "Sessão de Estudo IA".
 * Centraliza toda a lógica de configuração da sessão, filtragem
 * de conteúdos e chamada ao AIService.analyzeContent().
 *
 * O componente AIStudy.tsx contém APENAS lógica de apresentação.
 */

import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { aiService } from '../ai/services/AIService';
import type { ContentAnalysis, Difficulty } from '../ai/types/ai';

// ─── Tipos de configuração da sessão ─────────────────────────────────────────

export type SessionType     = 'exercises' | 'mini-test' | 'simulation' | 'quick-review' | 'flashcards';
export type PeriodFilter    = '7d' | '15d' | '30d' | 'specific' | 'range' | 'all';
export type StudyGoal       = 'learn' | 'review' | 'prepare-test' | 'improve-grade' | 'quick-review' | 'challenge';
export type StudyTime       = '15' | '30' | '45' | '60' | 'unlimited';
export type ContentPriority = 'most-recent' | 'oldest' | 'low-performance' | 'never-reviewed' | 'mixed';

export interface SessionConfig {
  subjectId:          string;
  selectedContentIds: string[];
  periodFilter:       PeriodFilter;
  periodStart?:       string;
  periodEnd?:         string;
  sessionType:        SessionType;
  difficulty:         Difficulty | 'mixed';
  questionCount:      5 | 10 | 15 | 20 | 30;
  studyGoal:          StudyGoal;
  studyTime:          StudyTime;
  contentPriority:    ContentPriority;
}

const DEFAULT_CONFIG: SessionConfig = {
  subjectId:          '',
  selectedContentIds: [],
  periodFilter:       'all',
  sessionType:        'exercises',
  difficulty:         'medio',
  questionCount:      10,
  studyGoal:          'review',
  studyTime:          '30',
  contentPriority:    'most-recent',
};

// ─── Labels para exibição ────────────────────────────────────────────────────

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'exercises':    'Exercícios',
  'mini-test':    'Mini Teste',
  'simulation':   'Simulado',
  'quick-review': 'Revisão Rápida',
  'flashcards':   'Flashcards',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  'facil':         'Fácil',
  'medio':         'Média',
  'dificil':       'Difícil',
  'muito_dificil': 'Muito Difícil',
  'mixed':         'Misto',
};

export const STUDY_GOAL_LABELS: Record<StudyGoal, string> = {
  'learn':          'Aprender conteúdo novo',
  'review':         'Rever matéria',
  'prepare-test':   'Preparar teste',
  'improve-grade':  'Melhorar a média',
  'quick-review':   'Revisão rápida',
  'challenge':      'Desafio (questões difíceis)',
};

export const STUDY_TIME_LABELS: Record<StudyTime, string> = {
  '15':        '15 minutos',
  '30':        '30 minutos',
  '45':        '45 minutos',
  '60':        '1 hora',
  'unlimited': 'Sem limite',
};

export const CONTENT_PRIORITY_LABELS: Record<ContentPriority, string> = {
  'most-recent':     'Conteúdos mais recentes',
  'oldest':          'Conteúdos mais antigos',
  'low-performance': 'Conteúdos com menor rendimento',
  'never-reviewed':  'Conteúdos nunca revisados',
  'mixed':           'Misturar todos',
};

// ─── Helpers de data ──────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAIStudySessionReturn {
  subjects:     ReturnType<typeof useApp>['subjects'];
  allContents:  ReturnType<typeof useApp>['contents'];
  config:       SessionConfig;

  setSubject:         (id: string) => void;
  setPeriodFilter:    (p: PeriodFilter) => void;
  setPeriodStart:     (d: string) => void;
  setPeriodEnd:       (d: string) => void;
  setSessionType:     (t: SessionType) => void;
  setDifficulty:      (d: SessionConfig['difficulty']) => void;
  setQuestionCount:   (n: SessionConfig['questionCount']) => void;
  setStudyGoal:       (g: StudyGoal) => void;
  setStudyTime:       (t: StudyTime) => void;
  setContentPriority: (p: ContentPriority) => void;

  filteredContents:    ReturnType<typeof useApp>['contents'];
  toggleContent:       (id: string) => void;
  selectAllContents:   () => void;
  deselectAllContents: () => void;
  isContentSelected:   (id: string) => boolean;

  isAnalysing:   boolean;
  analysisError: string | null;
  analysis:      ContentAnalysis | null;
  tokensUsed:    number;
  latencyMs:     number;

  canAnalyse:    boolean;
  runAnalysis:   () => Promise<void>;
  resetAnalysis: () => void;
  resetSession:  () => void;
}

export function useAIStudySession(): UseAIStudySessionReturn {
  const { subjects, contents } = useApp();

  const [config, setConfig] = useState<SessionConfig>(() => ({
    ...DEFAULT_CONFIG,
    subjectId: subjects[0]?.id ?? '',
  }));

  const [isAnalysing, setIsAnalysing]     = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis]           = useState<ContentAnalysis | null>(null);
  const [tokensUsed, setTokensUsed]       = useState(0);
  const [latencyMs, setLatencyMs]         = useState(0);

  // ── Helpers de configuração ─────────────────────────────────────────────────
  const setSubject = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, subjectId: id, selectedContentIds: [] }));
    setAnalysis(null);
    setAnalysisError(null);
  }, []);

  const setPeriodFilter    = useCallback((p: PeriodFilter)                   => setConfig(prev => ({ ...prev, periodFilter: p })), []);
  const setPeriodStart     = useCallback((d: string)                          => setConfig(prev => ({ ...prev, periodStart: d })), []);
  const setPeriodEnd       = useCallback((d: string)                          => setConfig(prev => ({ ...prev, periodEnd: d })), []);
  const setSessionType     = useCallback((t: SessionType)                     => setConfig(prev => ({ ...prev, sessionType: t })), []);
  const setDifficulty      = useCallback((d: SessionConfig['difficulty'])     => setConfig(prev => ({ ...prev, difficulty: d })), []);
  const setQuestionCount   = useCallback((n: SessionConfig['questionCount'])  => setConfig(prev => ({ ...prev, questionCount: n })), []);
  const setStudyGoal       = useCallback((g: StudyGoal)                       => setConfig(prev => ({ ...prev, studyGoal: g })), []);
  const setStudyTime       = useCallback((t: StudyTime)                       => setConfig(prev => ({ ...prev, studyTime: t })), []);
  const setContentPriority = useCallback((p: ContentPriority)                => setConfig(prev => ({ ...prev, contentPriority: p })), []);

  // ── Conteúdos filtrados ─────────────────────────────────────────────────────
  const filteredContents = useMemo(() => {
    let result = contents.filter(c => c.subjectId === config.subjectId);

    const { periodFilter, periodStart, periodEnd } = config;
    if (periodFilter === '7d')  result = result.filter(c => c.date >= daysAgo(7));
    if (periodFilter === '15d') result = result.filter(c => c.date >= daysAgo(15));
    if (periodFilter === '30d') result = result.filter(c => c.date >= daysAgo(30));
    if (periodFilter === 'specific' && periodStart)
      result = result.filter(c => c.date === periodStart);
    if (periodFilter === 'range' && periodStart && periodEnd)
      result = result.filter(c => c.date >= periodStart && c.date <= periodEnd);

    if (config.contentPriority === 'most-recent') result = [...result].sort((a, b) => b.date.localeCompare(a.date));
    if (config.contentPriority === 'oldest')      result = [...result].sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }, [contents, config.subjectId, config.periodFilter, config.periodStart, config.periodEnd, config.contentPriority]);

  // ── Selecção de conteúdos ───────────────────────────────────────────────────
  const toggleContent = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      selectedContentIds: prev.selectedContentIds.includes(id)
        ? prev.selectedContentIds.filter(x => x !== id)
        : [...prev.selectedContentIds, id],
    }));
  }, []);

  const selectAllContents   = useCallback(() => {
    setConfig(prev => ({ ...prev, selectedContentIds: filteredContents.map(c => c.id) }));
  }, [filteredContents]);

  const deselectAllContents = useCallback(() => {
    setConfig(prev => ({ ...prev, selectedContentIds: [] }));
  }, []);

  const isContentSelected = useCallback((id: string) =>
    config.selectedContentIds.includes(id), [config.selectedContentIds]);

  const canAnalyse = config.selectedContentIds.length > 0 && !isAnalysing;

  // ── Executar análise ────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!canAnalyse) return;
    setIsAnalysing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const selectedContents = contents.filter(c => config.selectedContentIds.includes(c.id));
      const subject          = subjects.find(s => s.id === config.subjectId);

      const combinedTitle = selectedContents.length === 1
        ? selectedContents[0].title
        : `${selectedContents.length} conteúdos de ${subject?.name ?? 'disciplina'}`;

      const combinedDescription = selectedContents
        .map(c => `[${c.date}] ${c.title}: ${c.description}`)
        .join('\n\n---\n\n');

      const combinedObservations = selectedContents
        .map(c => c.observations)
        .filter(Boolean)
        .join(' | ') || undefined;

      const result = await aiService.analyzeContent({
        content: {
          title:        combinedTitle,
          description:  combinedDescription,
          observations: combinedObservations,
          subject:      subject?.name ?? config.subjectId,
        },
        context: {
          subjectName: subject?.name ?? config.subjectId,
          difficulty:  config.difficulty === 'mixed' ? 'medio' : config.difficulty as Difficulty,
          language:    'pt-PT',
        },
      });

      if (result.success && result.data) {
        setAnalysis(result.data);
        setTokensUsed(result.tokensUsed ?? 0);
        setLatencyMs(result.latencyMs   ?? 0);
      } else {
        setAnalysisError(result.error ?? 'Erro desconhecido. Tenta novamente.');
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro inesperado. Tenta novamente.');
    } finally {
      setIsAnalysing(false);
    }
  }, [canAnalyse, config, contents, subjects]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setAnalysisError(null);
    setTokensUsed(0);
    setLatencyMs(0);
  }, []);

  const resetSession = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG, subjectId: subjects[0]?.id ?? '' });
    resetAnalysis();
  }, [subjects, resetAnalysis]);

  return {
    subjects, allContents: contents, config,
    setSubject, setPeriodFilter, setPeriodStart, setPeriodEnd,
    setSessionType, setDifficulty, setQuestionCount,
    setStudyGoal, setStudyTime, setContentPriority,
    filteredContents, toggleContent, selectAllContents,
    deselectAllContents, isContentSelected,
    isAnalysing, analysisError, analysis, tokensUsed, latencyMs,
    canAnalyse, runAnalysis, resetAnalysis, resetSession,
  };
}
