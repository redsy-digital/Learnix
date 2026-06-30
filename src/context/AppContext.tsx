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
import type { CreateContentPayload, UpdateContentPayload } from '../services/contentsService';
import type { CreateEvaluationPayload, UpdateEvaluationPayload } from '../services/evaluationsService';
import type { CreateScheduleSlotPayload, UpdateScheduleSlotPayload } from '../services/scheduleService';

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
  };
  updateUser: (data: Partial<AppContextType['user']>) => void;

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
  goals: AcademicGoal[];
  addGoal: (goal: Omit<AcademicGoal, 'id' | 'isCompleted'>) => void;
  toggleGoalCompletion: (id: string) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  aiQuestions: AIQuestion[];
  generateAIQuestions: (subjectId: string, type?: string) => void;
  submitAIAnswer: (questionId: string, answer: string) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_GOALS: AcademicGoal[] = [
  { id: 'g1', title: 'Chegar a média de 16 em Matemática', target: 16, current: 15.8, unit: 'média',         category: 'Notas',       dueDate: '2026-07-15', isCompleted: false },
  { id: 'g2', title: 'Estudar Química 4 vezes por semana', target: 4,  current: 3,    unit: 'vezes/semana',  category: 'Estudo',      dueDate: '2026-06-30', isCompleted: false },
  { id: 'g3', title: 'Resolver 100 exercícios este mês',   target: 100,current: 78,   unit: 'exercícios',    category: 'Atividades',  dueDate: '2026-06-30', isCompleted: false },
  { id: 'g4', title: 'Completar o resumo de História de hoje', target: 1, current: 1, unit: 'resumo',        category: 'Estudo',      dueDate: '2026-06-22', isCompleted: true },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Conteúdo do dia pendente',    description: 'Você ainda não registrou nenhum aprendizado hoje. Não perca a sequência diária!', time: 'Há 2 horas', type: 'warning', read: false },
  { id: 'n2', title: 'Meta semanal quase lá!',      description: 'Estudar Química está com 75% de progresso concluído. Falta apenas mais 1 sessão!', time: 'Há 5 horas', type: 'success', read: false },
  { id: 'n3', title: 'História precisa de atenção', description: 'Sua média em História está em 13.9, ligeiramente abaixo da sua meta pessoal de 14.5.', time: 'Ontem', type: 'info', read: false },
  { id: 'n4', title: 'Novo simulado de Biologia',   description: 'A IA gerou um novo miniteste de mitose personalizado baseado nos teus pontos fracos.', time: 'Há 2 dias', type: 'alert', read: true },
];

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
  const { profile, isLoggedIn, signOut, updateProfile } = useAuth();

  // ── Bridge: expor user no formato que as páginas esperam ─────────────────
  // As páginas usam useApp().user.name, .email, etc.
  // Agora esses valores vêm do perfil real do Supabase.
  const user = {
    name:       profile?.name        ?? 'Estudante',
    email:      profile?.email       ?? '',
    schoolYear: profile?.school_year ?? '',
    school:     profile?.school      ?? '',
    streak:     profile?.streak      ?? 0,
    avatarUrl:  profile?.avatar_url  ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name ?? 'U')}&background=4F46E5&color=fff&size=150`,
  };

  // updateUser agora persiste no Supabase via updateProfile do AuthContext
  const updateUser = async (data: Partial<typeof user>) => {
    await updateProfile({
      name:        data.name,
      school:      data.school,
      school_year: data.schoolYear,
    });
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

  // ── Dados académicos (mock — com localStorage para persistência local) ────
  const [goals, setGoals] = useState<AcademicGoal[]>(() => {
    const saved = localStorage.getItem('learnix_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('learnix_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
    profile?.theme_mode ?? 'light'
  );

  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>(DEFAULT_AI_QUESTIONS);

  // ── Sync mock data para localStorage ─────────────────────────────────────
  useEffect(() => { localStorage.setItem('learnix_goals',         JSON.stringify(goals)); },         [goals]);
  useEffect(() => { localStorage.setItem('learnix_notifications', JSON.stringify(notifications)); }, [notifications]);

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

  // ── Mutadores académicos (mock restante) ─────────────────────────────────

  const addGoal = (newGoal: Omit<AcademicGoal, 'id' | 'isCompleted'>) => {
    const id = `g_${Date.now()}`;
    setGoals((prev) => [{ id, ...newGoal, isCompleted: false }, ...prev]);
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals((prev) => prev.map((g) => {
      if (g.id !== id) return g;
      const isCompleted = !g.isCompleted;
      return { ...g, isCompleted, current: isCompleted ? g.target : 0 };
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
        // Dados académicos mock
        goals,
        addGoal,
        toggleGoalCompletion,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
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
