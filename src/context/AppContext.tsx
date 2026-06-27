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
} from '../types';
import { useAuth } from './AuthContext';

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

  // Dados académicos (mock — serão substituídos por Supabase em fases futuras)
  subjects: Subject[];
  contents: ContentRecord[];
  addContent: (content: Omit<ContentRecord, 'id'>) => void;
  schedule: ScheduleSlot[];
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>) => void;
  removeScheduleSlot: (id: string) => void;
  evaluations: Evaluation[];
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => void;
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

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'matematica', name: 'Matemática',  color: 'blue',    colorHex: '#2563EB', average: 15.8, performance: 81, contentsCount: 14, evaluationsCount: 3, lastActivity: 'Hoje' },
  { id: 'fisica',     name: 'Física',      color: 'indigo',  colorHex: '#6366F1', average: 14.2, performance: 72, contentsCount: 8,  evaluationsCount: 2, lastActivity: 'Ontem' },
  { id: 'quimica',    name: 'Química',     color: 'purple',  colorHex: '#7C3AED', average: 16.5, performance: 84, contentsCount: 9,  evaluationsCount: 2, lastActivity: 'Há 3 dias' },
  { id: 'biologia',   name: 'Biologia',    color: 'emerald', colorHex: '#10B981', average: 17.2, performance: 88, contentsCount: 11, evaluationsCount: 3, lastActivity: 'Há 1 semana' },
  { id: 'geografia',  name: 'Geografia',   color: 'amber',   colorHex: '#F59E0B', average: 15.0, performance: 77, contentsCount: 6,  evaluationsCount: 2, lastActivity: 'Há 4 dias' },
  { id: 'historia',   name: 'História',    color: 'rose',    colorHex: '#F43F5E', average: 13.9, performance: 68, contentsCount: 7,  evaluationsCount: 2, lastActivity: 'Ontem' },
  { id: 'portugues',  name: 'Português',   color: 'teal',    colorHex: '#14B8A6', average: 16.0, performance: 82, contentsCount: 12, evaluationsCount: 3, lastActivity: 'Hoje' },
  { id: 'ingles',     name: 'Inglês',      color: 'sky',     colorHex: '#0EA5E9', average: 18.1, performance: 92, contentsCount: 8,  evaluationsCount: 2, lastActivity: 'Há 2 semanas' },
  { id: 'frances',    name: 'Francês',     color: 'violet',  colorHex: '#8B5CF6', average: 14.8, performance: 74, contentsCount: 5,  evaluationsCount: 1, lastActivity: 'Há 5 dias' },
];

const INITIAL_CONTENTS: ContentRecord[] = [
  { id: 'c1', subjectId: 'matematica', subjectName: 'Matemática', date: '2026-06-22', title: 'Derivadas e Regra da Cadeia', description: 'Estudo aprofundado das derivadas de funções compostas. Aprendemos a identificar a função interna e externa e a aplicar a fórmula f\'(g(x)) * g\'(x). Resolvemos diversos problemas práticos aplicados à física clássica.', observations: 'Fazer os exercícios de 1 a 15 da página 142 do manual escolar.' },
  { id: 'c2', subjectId: 'portugues',  subjectName: 'Português',  date: '2026-06-22', title: 'Análise de "Os Lusíadas" - Canto V', description: 'Leitura comentada do Canto V, focando no episódio do Gigante Adamastor que simboliza os perigos enfrentados nas navegações e a superação humana. Analisamos os recursos expressivos mais frequentes como a hipérbole e a personificação.', observations: 'Preparar ficha de leitura resumida sobre o simbolismo do Adamastor.' },
  { id: 'c3', subjectId: 'fisica',     subjectName: 'Física',     date: '2026-06-21', title: 'Leis de Kepler e Gravitação', description: 'Definição e equacionamento das três leis de Kepler: Lei das Órbitas, Lei das Áreas e Lei dos Períodos. Deduzimos a constante ideal de proporcionalidade usando a Lei de Gravitação Universal de Newton.', observations: 'Rever as fórmulas de conversão de unidades astronómicas.' },
  { id: 'c4', subjectId: 'quimica',    subjectName: 'Química',    date: '2026-06-19', title: 'Cinética Química e Fatores de Velocidade', description: 'Fatores que alteram a velocidade das reações químicas: temperatura, concentração de reagentes, pressão (em sistemas gasosos), superfície de contacto e presença de catalisador. Teoria das Colisões e Energia de Ativação.', observations: 'Foco na interpretação de diagramas de energia.' },
  { id: 'c5', subjectId: 'biologia',   subjectName: 'Biologia',   date: '2026-06-15', title: 'Mitose e Divisão Celular', description: 'Estudo do ciclo celular. Fases detalhadas da mitose: Prófase (condensação dos cromossomas), Metáfase (placa equatorial), Anáfase (separação dos cromatídeos) e Telófase (reorganização dos núcleos). Citocinese vegetal vs animal.', observations: 'Reconhecer imagens de lâminas microscópicas das fases no exame prático.' },
];

const INITIAL_SCHEDULE: ScheduleSlot[] = [
  { id: 's1',  day: 'Segunda', time: '08:15 - 09:45', subjectId: 'matematica', subjectName: 'Matemática', room: 'Sala 102' },
  { id: 's2',  day: 'Segunda', time: '10:00 - 11:30', subjectId: 'portugues',  subjectName: 'Português',  room: 'Sala 204' },
  { id: 's3',  day: 'Segunda', time: '11:45 - 13:15', subjectId: 'ingles',     subjectName: 'Inglês',     room: 'Sala C10' },
  { id: 's4',  day: 'Segunda', time: '14:30 - 16:00', subjectId: 'historia',   subjectName: 'História',   room: 'Sala 302' },
  { id: 's5',  day: 'Terça',   time: '08:15 - 09:45', subjectId: 'fisica',     subjectName: 'Física',     room: 'Laboratório A' },
  { id: 's6',  day: 'Terça',   time: '10:00 - 11:30', subjectId: 'quimica',    subjectName: 'Química',    room: 'Laboratório B' },
  { id: 's7',  day: 'Terça',   time: '11:45 - 13:15', subjectId: 'biologia',   subjectName: 'Biologia',   room: 'Sala de Biologia' },
  { id: 's8',  day: 'Quarta',  time: '08:15 - 09:45', subjectId: 'matematica', subjectName: 'Matemática', room: 'Sala 102' },
  { id: 's9',  day: 'Quarta',  time: '10:00 - 11:30', subjectId: 'geografia',  subjectName: 'Geografia',  room: 'Sala 201' },
  { id: 's10', day: 'Quarta',  time: '11:45 - 13:15', subjectId: 'portugues',  subjectName: 'Português',  room: 'Sala 204' },
  { id: 's11', day: 'Quarta',  time: '14:30 - 16:00', subjectId: 'frances',    subjectName: 'Francês',    room: 'Sala C12' },
  { id: 's12', day: 'Quinta',  time: '08:15 - 09:45', subjectId: 'fisica',     subjectName: 'Física',     room: 'Sala 101' },
  { id: 's13', day: 'Quinta',  time: '10:00 - 11:30', subjectId: 'quimica',    subjectName: 'Química',    room: 'Sala 101' },
  { id: 's14', day: 'Quinta',  time: '11:45 - 13:15', subjectId: 'biologia',   subjectName: 'Biologia',   room: 'Sala de Biologia' },
  { id: 's15', day: 'Sexta',   time: '08:15 - 09:45', subjectId: 'matematica', subjectName: 'Matemática', room: 'Sala 102' },
  { id: 's16', day: 'Sexta',   time: '10:00 - 11:30', subjectId: 'geografia',  subjectName: 'Geografia',  room: 'Sala 201' },
  { id: 's17', day: 'Sexta',   time: '11:45 - 13:15', subjectId: 'historia',   subjectName: 'História',   room: 'Sala 302' },
];

const INITIAL_EVALUATIONS: Evaluation[] = [
  { id: 'e1',  subjectId: 'matematica', subjectName: 'Matemática', type: 'Prova',       date: '2026-06-18', maxValue: 20, gradeObtained: 16.4, notes: 'Prova sobre Limites e Sequências. Excelente nota!' },
  { id: 'e2',  subjectId: 'matematica', subjectName: 'Matemática', type: 'Trabalho',    date: '2026-06-02', maxValue: 20, gradeObtained: 17.0, notes: 'Apresentação sobre a História do Cálculo Diferencial.' },
  { id: 'e3',  subjectId: 'matematica', subjectName: 'Matemática', type: 'Exercício',   date: '2026-05-15', maxValue: 20, gradeObtained: 14.0, notes: 'Ficha de consolidação em sala.' },
  { id: 'e4',  subjectId: 'fisica',     subjectName: 'Física',     type: 'Prova',       date: '2026-06-10', maxValue: 20, gradeObtained: 13.5, notes: 'Teste escrito sobre Dinâmica de Partículas.' },
  { id: 'e5',  subjectId: 'fisica',     subjectName: 'Física',     type: 'Trabalho',    date: '2026-05-20', maxValue: 20, gradeObtained: 15.0, notes: 'Relatório clínico das experiências com plano inclinado.' },
  { id: 'e6',  subjectId: 'portugues',  subjectName: 'Português',  type: 'Prova',       date: '2026-06-12', maxValue: 20, gradeObtained: 16.5 },
  { id: 'e7',  subjectId: 'portugues',  subjectName: 'Português',  type: 'Trabalho',    date: '2026-05-28', maxValue: 20, gradeObtained: 15.5 },
  { id: 'e8',  subjectId: 'portugues',  subjectName: 'Português',  type: 'Participação',date: '2026-06-05', maxValue: 20, gradeObtained: 16.0 },
  { id: 'e9',  subjectId: 'quimica',    subjectName: 'Química',    type: 'Prova',       date: '2026-06-15', maxValue: 20, gradeObtained: 17.5 },
  { id: 'e10', subjectId: 'biologia',   subjectName: 'Biologia',   type: 'Prova',       date: '2026-06-08', maxValue: 20, gradeObtained: 18.0, notes: 'Avaliação sobre respiração celular e sementes.' },
  { id: 'e11', subjectId: 'geografia',  subjectName: 'Geografia',  type: 'Prova',       date: '2026-05-25', maxValue: 20, gradeObtained: 15.0 },
  { id: 'e12', subjectId: 'historia',   subjectName: 'História',   type: 'Prova',       date: '2026-06-04', maxValue: 20, gradeObtained: 13.0, notes: 'Primeira guerra mundial e alianças de poder.' },
  { id: 'e13', subjectId: 'ingles',     subjectName: 'Inglês',     type: 'Prova',       date: '2026-06-11', maxValue: 20, gradeObtained: 18.5 },
];

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

  // ── Dados académicos (mock — com localStorage para persistência local) ────
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('learnix_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [contents, setContents] = useState<ContentRecord[]>(() => {
    const saved = localStorage.getItem('learnix_contents');
    return saved ? JSON.parse(saved) : INITIAL_CONTENTS;
  });

  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    const saved = localStorage.getItem('learnix_schedule');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => {
    const saved = localStorage.getItem('learnix_evaluations');
    return saved ? JSON.parse(saved) : INITIAL_EVALUATIONS;
  });

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
  useEffect(() => { localStorage.setItem('learnix_subjects',      JSON.stringify(subjects)); },      [subjects]);
  useEffect(() => { localStorage.setItem('learnix_contents',      JSON.stringify(contents)); },      [contents]);
  useEffect(() => { localStorage.setItem('learnix_schedule',      JSON.stringify(schedule)); },      [schedule]);
  useEffect(() => { localStorage.setItem('learnix_evaluations',   JSON.stringify(evaluations)); },   [evaluations]);
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

  // ── Mutadores académicos (inalterados) ────────────────────────────────────

  const addContent = (newRecord: Omit<ContentRecord, 'id'>) => {
    const id = `c_${Date.now()}`;
    const record: ContentRecord = { id, ...newRecord };
    setContents((prev) => [record, ...prev]);
    setSubjects((prev) => prev.map((sub) =>
      sub.id === newRecord.subjectId
        ? { ...sub, contentsCount: sub.contentsCount + 1, lastActivity: 'Hoje' }
        : sub
    ));
    setGoals((prev) => prev.map((g) => {
      if ((g.category === 'Estudo' || g.unit === 'resumo' || g.unit === 'exercícios') && g.current < g.target) {
        const nextVal = g.current + 1;
        return { ...g, current: nextVal, isCompleted: nextVal >= g.target };
      }
      return g;
    }));
    setNotifications((prev) => prev.map((n) => n.id === 'n1' ? { ...n, read: true } : n));
  };

  const addScheduleSlot = (newSlot: Omit<ScheduleSlot, 'id'>) => {
    const id = `s_${Date.now()}`;
    setSchedule((prev) => [...prev, { id, ...newSlot }]);
  };

  const removeScheduleSlot = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  const addEvaluation = (newEval: Omit<Evaluation, 'id'>) => {
    const id = `e_${Date.now()}`;
    const evaluation: Evaluation = { id, ...newEval };
    setEvaluations((prev) => [evaluation, ...prev]);
    setSubjects((prevSubjects) => prevSubjects.map((sub) => {
      if (sub.id !== newEval.subjectId) return sub;
      const currentEvals = [evaluation, ...evaluations.filter((ev) => ev.subjectId === sub.id)];
      const sum = currentEvals.reduce((acc, ev) => acc + (ev.gradeObtained / ev.maxValue) * 20, 0);
      const newAvg  = parseFloat((sum / currentEvals.length).toFixed(1));
      const newPerf = Math.round((newAvg / 20) * 100);
      return { ...sub, evaluationsCount: currentEvals.length, average: newAvg, performance: newPerf, lastActivity: 'Hoje' };
    }));
  };

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
        subjects,
        contents,
        addContent,
        schedule,
        addScheduleSlot,
        removeScheduleSlot,
        evaluations,
        addEvaluation,
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
