/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AppContext — Dados académicos e lógica de negócio (mock)
 *
 * NOTA: A autenticação foi completamente removida deste contexto.
 * Toda a lógica de sessão, login, logout e perfil real está em AuthContext.tsx.
 *
 * Este contexto mantém:
 *  - Disciplinas (mock)
 *  - Conteúdos (mock)
 *  - Horário (mock)
 *  - Avaliações (mock)
 *  - Metas (mock)
 *  - Notificações (mock)
 *  - Questões de IA (mock)
 *  - Tema visual
 *
 * O campo `user` exposto aqui agora lê do AuthContext (perfil real do Supabase).
 * As páginas que usam `useApp().user` continuam a funcionar sem modificação.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Subject,
  ContentRecord,
  ScheduleSlot,
  Evaluation,
  AcademicGoal,
  AppNotification,
  AIQuestion,
  CreateSubjectPayload,
  UpdateSubjectPayload,
} from '../types';
import { useAuth } from './AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import { useContents } from '../hooks/useContents';
import { useEvaluations } from '../hooks/useEvaluations';
import { useSchedule } from '../hooks/useSchedule';
import { useGoals } from '../hooks/useGoals';
import { useNotifications } from '../hooks/useNotifications';
import type { CreateContentPayload, UpdateContentPayload } from '../services/contentsService';
import type { CreateEvaluationPayload, UpdateEvaluationPayload } from '../services/evaluationsService';
import type { CreateScheduleSlotPayload, UpdateScheduleSlotPayload } from '../services/scheduleService';
import type { CreateGoalPayload, UpdateGoalPayload, AutoProgressContext } from '../services/goalsService';

// ─── Interface do contexto ────────────────────────────────────────────────────

interface AppContextType {
  // Compatibilidade: user expõe dados do perfil real (AuthContext)
  user: {
    name: string;
    email: string;
    schoolYear: string;
    school: string;
    streak: number;
    avatarUrl: string;
    targetUni: string;
    notifyDaily: boolean;
    notifyWeekly: boolean;
    notifyAi: boolean;
  };
  updateUser: (data: Partial<Omit<AppContextType['user'], 'email'>>) => Promise<void>;
  /**
   * Alterar o email segue o fluxo próprio do Supabase Auth — nunca um
   * simples UPDATE na tabela profiles. O Supabase envia um email de
   * confirmação para o novo endereço; o email só muda de facto depois
   * de o utilizador clicar no link de confirmação.
   */
  updateEmail: (newEmail: string) => Promise<void>;

  // Auth bridge — para compatibilidade com DashboardLayout e LandingPage
  isLoggedIn: boolean;
  logout: () => void;

  // Disciplinas — dados reais do Supabase
  subjects: Subject[];
  subjectsLoading: boolean;
  subjectsError: string | null;
  addSubject:    (payload: CreateSubjectPayload) => Promise<Subject>;
  editSubject:   (id: string, payload: UpdateSubjectPayload) => Promise<Subject>;
  removeSubject: (id: string) => Promise<void>;
  getDependencies: (id: string) => Promise<{ contents: number; evaluations: number; scheduleSlots: number }>;
  refreshSubjects: () => Promise<void>;

  // Conteúdos estudados — dados reais do Supabase
  contents: ContentRecord[];
  contentsLoading: boolean;
  contentsError: string | null;
  addContent:    (payload: CreateContentPayload) => Promise<ContentRecord>;
  editContent:   (id: string, payload: UpdateContentPayload) => Promise<ContentRecord>;
  removeContent: (id: string, photoPath?: string) => Promise<void>;
  uploadPhoto:   (file: File) => Promise<string>;
  getSignedPhotoUrl: (photoPath: string) => Promise<string>;
  refreshContents: () => Promise<void>;
  // Horário escolar — dados reais do Supabase
  schedule: ScheduleSlot[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  addScheduleSlot:    (payload: CreateScheduleSlotPayload) => Promise<ScheduleSlot>;
  editScheduleSlot:   (id: string, payload: UpdateScheduleSlotPayload) => Promise<ScheduleSlot>;
  removeScheduleSlot: (id: string) => Promise<void>;
  checkScheduleOverlap: (dayName: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  refreshSchedule: () => Promise<void>;
  // Avaliações — dados reais do Supabase
  evaluations: Evaluation[];
  evaluationsLoading: boolean;
  evaluationsError: string | null;
  addEvaluation:    (payload: CreateEvaluationPayload) => Promise<Evaluation>;
  editEvaluation:   (id: string, payload: UpdateEvaluationPayload) => Promise<Evaluation>;
  removeEvaluation: (id: string) => Promise<void>;
  refreshEvaluations: () => Promise<void>;
  // Metas — dados reais do Supabase
  goals: AcademicGoal[];
  goalsLoading: boolean;
  goalsError: string | null;
  addGoal:          (payload: CreateGoalPayload) => Promise<AcademicGoal>;
  editGoal:         (id: string, payload: UpdateGoalPayload) => Promise<AcademicGoal>;
  removeGoal:       (id: string) => Promise<void>;
  toggleGoalCompletion: (id: string, isCurrentlyCompleted: boolean) => Promise<void>;
  setGoalProgress:  (id: string, current: number) => Promise<void>;
  syncGoalProgress: (ctx: AutoProgressContext) => Promise<void>;
  refreshGoals:     () => Promise<void>;
  // Notificações — dados reais do Supabase
  notifications: AppNotification[];
  notificationsLoading: boolean;
  unreadCount: number;
  markNotificationAsRead:    (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  removeNotification:        (id: string) => Promise<void>;
  removeAllReadNotifications: () => Promise<void>;
  refreshNotifications:      () => Promise<void>;
  aiQuestions: AIQuestion[];
  generateAIQuestions: (subjectId: string, type?: string) => void;
  submitAIAnswer: (questionId: string, answer: string) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_AI_DATABASE: Record<string, AIQuestion[]> = {
  matematica: [
    { id: 'q_mat_1', type: 'multiple-choice', question: 'Determine a derivada da função h(x) = (3x² + 2)⁵ em relação a x resolvendo pela Regra da Cadeia.', options: ['A) 5(3x² + 2)⁴', 'B) 30x(3x² + 2)⁴', 'C) 15x(3x² + 2)⁴', 'D) 6x(3x² + 2)⁴'], correctAnswer: 'B) 30x(3x² + 2)⁴', explanation: 'Pela regra da cadeia, a derivada de f(g(x)) é f\'(g(x)) * g\'(x). Aqui f(u) = u⁵, pelo que f\'(u) = 5u⁴, e g(x) = 3x² + 2, pelo que g\'(x) = 6x. Multiplicando ambos, temos: 5(3x² + 2)⁴ * (6x) = 30x(3x² + 2)⁴.' },
    { id: 'q_mat_2', type: 'open',            question: 'Se f(x) = ln(e^x * x), calcule a derivada simplificada f\'(1).', correctAnswer: '2', explanation: 'Podemos reescrever f(x) usando as propriedades dos logaritmos: f(x) = ln(e^x) + ln(x) = x + ln(x). Derivando f(x): f\'(x) = 1 + 1/x. Portanto, f\'(1) = 1 + 1/1 = 2.' },
    { id: 'q_mat_3', type: 'calculation',     question: 'Calcule o limite de (x² - 9)/(x - 3) quando x tende a 3.', correctAnswer: '6', explanation: 'Temos uma indeterminação do tipo 0/0. Fatorizando o numerador: x² - 9 = (x - 3)(x + 3). Simplificando o fator (x - 3) com o denominador para x diferente de 3, obtemos lim (x + 3) = 3 + 3 = 6.' },
  ],
  biologia: [
    { id: 'q_bio_1', type: 'multiple-choice', question: 'Em que fase da mitose ocorre o alinhamento dos cromossomas na placa equatorial e a sua máxima condensação?', options: ['A) Prófase', 'B) Metáfase', 'C) Anáfase', 'D) Telófase'], correctAnswer: 'B) Metáfase', explanation: 'É durante a metáfase que os microtúbulos do fuso mitótico ligam-se aos cinetócoros dos cromossomas bilaterais, alinhando-os perfeitamente no equador da célula antes da separação cromatídica.' },
    { id: 'q_bio_2', type: 'open',            question: 'Explique brevemente a diferença entre a citocinese animal e a citocinese vegetal.', correctAnswer: 'A citocinese animal é centrípeta (estrangulamento de fora para dentro com anel contráctil), enquanto a vegetal é centrífuga (formação de nova parede celular a partir do fragmoplasto, de dentro para fora).', explanation: 'Devido à rígida parede celular celulósica das plantas, as células vegetais não podem sofrer estrangulamento. Elas utilizam vesículas de Golgi portando precursores de parede para consolidar a divisão do meio para as bordas.' },
  ],
  fisica: [
    { id: 'q_fis_1', type: 'multiple-choice', question: 'De acordo com a 3ª Lei de Kepler (Lei dos Períodos), a razão entre o quadrado do período de revolução de um planeta (T²) e o cubo do raio médio da sua órbita (r³) é:', options: ['A) Inversamente proporcional à massa de cada planeta', 'B) Uma constante idêntica para todos os planetas que orbitam a mesma estrela', 'C) Nula em sistemas de gravitação forte', 'D) Diretamente dependente do raio do planeta em si'], correctAnswer: 'B) Uma constante idêntica para todos os planetas que orbitam a mesma estrela', explanation: 'A constante de Kepler K = T²/r³ depende unicamente da massa da estrela central receptora da gravitação: K = 4π² / (G * M). Por isso, permanece constante para qualquer astro orbital sob o campo desse sol central.' },
    { id: 'q_fis_2', type: 'calculation',     question: 'Se a aceleração gravítica na Terra é g = 9.8 m/s², calcule com 1 casa decimal o peso de uma massa de 15 kg na superfície terrestre em Newtons.', correctAnswer: '147', explanation: 'P = m * g = 15 * 9.8 = 147 N.' },
  ],
  quimica: [
    { id: 'q_qui_1', type: 'multiple-choice', question: 'Qual o efeito de um catalisador sobre o progresso termodinâmico de uma reação química?', options: ['A) Aumenta a entalpia total dos produtos finais', 'B) Diminui a energia de ativação criando um mecanismo alternativo', 'C) Altera o valor da variação de entalpia (ΔH) global', 'D) Diminui o rendimento de produtos obtidos no equilíbrio'], correctAnswer: 'B) Diminui a energia de ativação criando um mecanismo alternativo', explanation: 'O catalisador acelera a velocidade da reação pois oferece um caminho de reação alternativo com uma menor energia de ativação. Ele não altera os níveis energéticos iniciais dos reagentes nem finais dos produtos (ou seja, o ΔH mantém-se constante).' },
  ],
};

const DEFAULT_AI_QUESTIONS: AIQuestion[] = [
  { id: 'q_def_1', type: 'multiple-choice', question: 'Qual é o principal foco da Cinética Química no estudo das reações?', options: ['A) Determinar a espontaneidade com base na energia livre de Gibbs', 'B) Analisar a velocidade da reação e os fatores que a influenciam', 'C) Estudar estritamente o equilíbrio eletrónico das órbitas polares', 'D) Avaliar os desvios ideais de gases nobres em criogenia'], correctAnswer: 'B) Analisar a velocidade da reação e os fatores que a influenciam', explanation: 'A cinética química é a área dedicada ao estudo das velocidades dos processos químicos e como elementos como calor, pressão e catalisadores aceleram ou retardam essa velocidade.' },
  { id: 'q_def_2', type: 'open',            question: 'Qual o principal recurso expressivo usado por Camões em Os Lusíadas ao criar a terrível figura do Adamastor?', correctAnswer: 'A personificação ou prosopopeia.', explanation: 'O Adamastor personifica os medos ocultos e mistérios do Oceano Atlântico (o Cabo das Tormentas), transformando o cabo rochoso num gigante temível com feições humanas, fala, ódio e lamento poético.' },
];

// ─── Provider ────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Ler perfil real do AuthContext ────────────────────────────────────────
  const { profile, isLoggedIn, signOut, updateProfile, updateProfileEmail } = useAuth();

  // ── Bridge: expor user no formato que as páginas esperam ─────────────────
  // As páginas usam useApp().user.name, .email, etc.
  // Agora esses valores vêm do perfil real do Supabase.
  const user = {
    name:         profile?.name          ?? 'Estudante',
    email:        profile?.email         ?? '',
    schoolYear:   profile?.school_year   ?? '',
    school:       profile?.school        ?? '',
    streak:       profile?.streak        ?? 0,
    avatarUrl:    profile?.avatar_url    ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? 'U')}&background=4F46E5&color=fff&size=150`,
    targetUni:    profile?.target_uni    ?? '',
    notifyDaily:  profile?.notify_daily  ?? true,
    notifyWeekly: profile?.notify_weekly ?? true,
    notifyAi:     profile?.notify_ai     ?? true,
  };

  // updateUser agora persiste no Supabase via updateProfile do AuthContext.
  // Cobre todos os campos editáveis de profiles excepto email (ver updateEmail).
  const updateUser = async (data: Partial<Omit<typeof user, 'email'>>) => {
    await updateProfile({
      ...(data.name         !== undefined && { name:          data.name }),
      ...(data.school       !== undefined && { school:        data.school }),
      ...(data.schoolYear   !== undefined && { school_year:   data.schoolYear }),
      ...(data.targetUni    !== undefined && { target_uni:    data.targetUni }),
      ...(data.notifyDaily  !== undefined && { notify_daily:  data.notifyDaily }),
      ...(data.notifyWeekly !== undefined && { notify_weekly: data.notifyWeekly }),
      ...(data.notifyAi     !== undefined && { notify_ai:     data.notifyAi }),
    });
  };

  /**
   * Alterar email delega para o AuthContext, que usa o fluxo próprio
   * do Supabase Auth (supabase.auth.updateUser) — nunca um UPDATE
   * directo em profiles. O Supabase envia um email de confirmação
   * para o novo endereço antes de o email mudar de facto.
   */
  const updateEmail = async (newEmail: string) => {
    await updateProfileEmail(newEmail);
  };

  // logout delega para o AuthContext (Supabase Auth)
  const logout = () => { signOut(); };

  // ── Disciplinas — dados reais do Supabase (via hook) ─────────────────────
  const {
    subjects,
    isLoading: subjectsLoading,
    error:     subjectsError,
    addSubject,
    editSubject,
    removeSubject,
    getDependencies,
    refresh:   refreshSubjects,
  } = useSubjects();

  // ── Conteúdos — dados reais do Supabase (via hook) ───────────────────────
  const {
    contents,
    isLoading: contentsLoading,
    error:     contentsError,
    addContent,
    editContent,
    removeContent,
    uploadPhoto,
    getSignedPhotoUrl,
    refresh:   refreshContents,
  } = useContents();

  // ── Avaliações — dados reais do Supabase (via hook) ──────────────────────
  // onMutate: após cada mutação, refreshSubjects actualiza subject_stats
  // (médias, rendimento e contagens calculados pela VIEW do PostgreSQL)
  const {
    evaluations,
    isLoading: evaluationsLoading,
    error:     evaluationsError,
    addEvaluation,
    editEvaluation,
    removeEvaluation,
    refresh:   refreshEvaluations,
  } = useEvaluations(refreshSubjects);

  // ── Horário escolar — dados reais do Supabase (via hook) ─────────────────
  const {
    schedule,
    isLoading: scheduleLoading,
    error:     scheduleError,
    addScheduleSlot,
    editScheduleSlot,
    removeScheduleSlot,
    checkOverlap: checkScheduleOverlap,
    refresh:   refreshSchedule,
  } = useSchedule();

  // ── Metas — dados reais do Supabase (via hook) ───────────────────────────
  const {
    goals,
    isLoading: goalsLoading,
    error:     goalsError,
    addGoal,
    editGoal,
    removeGoal,
    completeGoal:     toggleGoalCompletion,
    setGoalProgress,
    syncAutoProgress: syncGoalProgress,
    refresh:          refreshGoals,
  } = useGoals();

  // ── Notificações — dados reais do Supabase (via hook) ────────────────────
  // O hook recebe o contexto de dados para gerar notificações automáticas
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markRead:       markNotificationAsRead,
    markAllRead:    markAllNotificationsAsRead,
    removeNotification,
    removeAllRead:  removeAllReadNotifications,
    refresh:        refreshNotifications,
  } = useNotifications({
    subjects, contents, schedule, goals, evaluations,
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    profile?.theme_mode ?? 'light'
  );

  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>(DEFAULT_AI_QUESTIONS);

  // ── Tema: sincronizar com o perfil real quando carrega ───────────────────
  useEffect(() => {
    if (profile?.theme_mode) setThemeMode(profile.theme_mode);
  }, [profile?.theme_mode]);

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persistir preferência de tema no Supabase se o utilizador estiver autenticado
    if (profile) updateProfile({ theme_mode: themeMode }).catch(() => {});
  }, [themeMode]);

  // ── Mutadores (mock restante — IA) ────────────────────────────────────────

  const generateAIQuestions = (subjectId: string, _type?: string) => {
    const pool = MOCK_AI_DATABASE[subjectId] || DEFAULT_AI_QUESTIONS;
    setAiQuestions(pool.map((q) => ({ ...q, studentAnswer: undefined, isCorrect: undefined })));
  };

  const submitAIAnswer = (questionId: string, answer: string) => {
    setAiQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      const isCorrect = q.type === 'multiple-choice'
        ? answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
        : true; // questões abertas: avaliação futura por IA
      return { ...q, studentAnswer: answer, isCorrect };
    }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        user,
        updateUser,
        updateEmail,
        isLoggedIn,
        logout,
        // Disciplinas reais (Supabase)
        subjects,
        subjectsLoading,
        subjectsError,
        addSubject,
        editSubject,
        removeSubject,
        getDependencies,
        refreshSubjects,
        // Conteúdos reais (Supabase)
        contents,
        contentsLoading,
        contentsError,
        addContent,
        editContent,
        removeContent,
        uploadPhoto,
        getSignedPhotoUrl,
        refreshContents,
        // Avaliações reais (Supabase)
        evaluations,
        evaluationsLoading,
        evaluationsError,
        addEvaluation,
        editEvaluation,
        removeEvaluation,
        refreshEvaluations,
        // Horário reais (Supabase)
        schedule,
        scheduleLoading,
        scheduleError,
        addScheduleSlot,
        editScheduleSlot,
        removeScheduleSlot,
        checkScheduleOverlap,
        refreshSchedule,
        // Metas reais (Supabase)
        goals,
        goalsLoading,
        goalsError,
        addGoal,
        editGoal,
        removeGoal,
        toggleGoalCompletion,
        setGoalProgress,
        syncGoalProgress,
        refreshGoals,
        // Notificações reais (Supabase)
        notifications,
        notificationsLoading,
        unreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
        removeAllReadNotifications,
        refreshNotifications,
        // IA (mock)
        aiQuestions,
        generateAIQuestions,
        submitAIAnswer,
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return context;
};
