/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * types.ts — Contratos de dados do Learnix
 *
 * Separação clara entre:
 *  - Tipos "DB" → espelham exactamente as colunas do Supabase
 *  - Tipos "UI" → enriquecem os dados DB com campos calculados para o frontend
 */

// ─── Subject ──────────────────────────────────────────────────────────────────

/**
 * SubjectDB — espelha a tabela `subjects` do Supabase.
 * Sem campos calculados (average, performance, etc.).
 */
export interface SubjectDB {
  id: string;
  user_id: string;
  name: string;
  color: string;      // sufixo Tailwind, ex: 'blue'
  color_hex: string;  // hex exacto, ex: '#2563EB'
  created_at: string;
  updated_at: string;
}

/**
 * SubjectStats — espelha a VIEW `subject_stats` do Supabase.
 * Inclui métricas calculadas em tempo real pelo PostgreSQL.
 */
export interface SubjectStats {
  subject_id: string;
  user_id: string;
  name: string;
  color: string;
  color_hex: string;
  contents_count: number;
  evaluations_count: number;
  average: number;
  performance: number;
  last_activity_date: string | null;
}

/**
 * Subject — tipo UI (compatibilidade com todo o frontend existente).
 * Mantém os nomes de campos em camelCase que as páginas já usam.
 */
export interface Subject {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  average: number;
  performance: number;
  contentsCount: number;
  evaluationsCount: number;
  lastActivity: string;
}

// ─── ContentRecord ────────────────────────────────────────────────────────────

export interface ContentRecord {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  title: string;
  description: string;
  observations?: string;
  isPhotoUpload?: boolean;
  photoUrl?: string;
}

// ─── ScheduleSlot ─────────────────────────────────────────────────────────────

export interface ScheduleSlot {
  id: string;
  day: string;   // 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'
  time: string;  // ex: '08:00 - 09:30'
  subjectId: string;
  subjectName: string;
  room?: string;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface Evaluation {
  id: string;
  subjectId: string;
  subjectName: string;
  type: 'Prova' | 'Trabalho' | 'Exercício' | 'Teste Surpresa' | 'Participação';
  date: string;
  maxValue: number;
  gradeObtained: number;
  notes?: string;
}

// ─── AcademicGoal ─────────────────────────────────────────────────────────────

export interface AcademicGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  category: string;
  dueDate: string;
  isCompleted: boolean;
}

// ─── AppNotification ──────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  read: boolean;
}

// ─── AIQuestion ───────────────────────────────────────────────────────────────

export interface AIQuestion {
  id: string;
  type: 'multiple-choice' | 'open' | 'calculation' | 'quick-review';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

/** Payload para criar uma disciplina (sem id, user_id, timestamps) */
export interface CreateSubjectPayload {
  name: string;
  color: string;
  color_hex: string;
}

/** Payload para editar uma disciplina */
export interface UpdateSubjectPayload {
  name?: string;
  color?: string;
  color_hex?: string;
}
