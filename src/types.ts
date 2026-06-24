/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class suffix (e.g. 'blue', 'purple', 'emerald')
  colorHex: string; // Exact hex color for chart display
  average: number;
  performance: number; // 0-100 percentage
  contentsCount: number;
  evaluationsCount: number;
  lastActivity: string; // date string or "Hoje", "Ontem"
}

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

export interface ScheduleSlot {
  id: string;
  day: string; // "Segunda", "Terça", "Quarta", "Quinta", "Sexta"
  time: string; // e.g. "08:00 - 09:30"
  subjectId: string;
  subjectName: string;
  room?: string;
}

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

export interface AcademicGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string; // e.g. "pontos", "horas", "exercícios"
  category: string; // e.g. "Estudo", "Notas", "Atividades"
  dueDate: string;
  isCompleted: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  read: boolean;
}

export interface AIQuestion {
  id: string;
  type: 'multiple-choice' | 'open' | 'calculation' | 'quick-review';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}
