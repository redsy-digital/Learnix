/**
 * notificationsService.ts
 *
 * Camada de acesso a dados para notificações.
 * Inclui:
 *  1. CRUD real contra a tabela `notifications` do Supabase
 *  2. Motor de geração automática baseado em regras de negócio (sem IA)
 *
 * Anti-duplicação: cada regra tem uma `ruleKey` única.
 * Antes de criar uma notificação, verifica se já existe uma não lida
 * com o mesmo ruleKey no título (via prefixo único por regra).
 * Assim nunca se geram duplicados em chamadas consecutivas.
 */

import { supabase } from '../lib/supabase';
import type { AppNotification, Subject, ContentRecord, ScheduleSlot, AcademicGoal, Evaluation } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NotifType = 'info' | 'success' | 'warning' | 'alert';

/** Linha da tabela `notifications` */
interface NotifRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  notif_type: NotifType;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

/** Payload para criar notificação */
interface CreateNotifPayload {
  title: string;
  description: string;
  notifType: NotifType;
}

// ─── Helper: DB row → AppNotification (UI) ────────────────────────────────────

function rowToNotif(row: NotifRow): AppNotification {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? '',
    time:        formatRelativeTime(row.created_at),
    type:        row.notif_type,
    read:        row.read,
  };
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Agora mesmo';
  if (mins < 60)  return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ontem';
  if (days < 7)   return `Há ${days} dias`;
  if (days < 14)  return 'Há 1 semana';
  return `Há ${Math.floor(days / 7)} semanas`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

const SELECT_QUERY = 'id, user_id, title, description, notif_type, read, read_at, created_at';

/** Carrega todas as notificações, ordenadas da mais recente para a mais antiga */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(SELECT_QUERY)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as NotifRow[]).map(rowToNotif);
}

/** Cria uma notificação associada ao utilizador autenticado */
async function createNotification(
  userId: string,
  payload: CreateNotifPayload
): Promise<AppNotification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id:     userId,
      title:       payload.title,
      description: payload.description,
      notif_type:  payload.notifType,
    })
    .select(SELECT_QUERY)
    .single();

  if (error) throw new Error(error.message);
  return rowToNotif(data as NotifRow);
}

/** Marca uma notificação como lida (read_at é preenchido pelo trigger no DB) */
export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Marca todas as notificações não lidas do utilizador como lidas */
export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw new Error(error.message);
}

/** Apaga uma notificação */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Apaga todas as notificações lidas do utilizador */
export async function deleteAllRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('read', true);
  if (error) throw new Error(error.message);
}

// ─── Motor de Regras ──────────────────────────────────────────────────────────

/**
 * Contexto de dados para a geração de notificações.
 * Passado pelo hook ao chamar generateSmartNotifications().
 */
export interface NotifGenerationContext {
  subjects:    Subject[];
  contents:    ContentRecord[];
  schedule:    ScheduleSlot[];
  goals:       AcademicGoal[];
  evaluations: Evaluation[];
}

/**
 * Chave única por regra — prefixo do título da notificação.
 * É usada para verificar se já existe uma notificação não lida
 * da mesma regra antes de criar outra.
 */
const RULE_KEYS = {
  todayLessons:       '[AULAS]',
  noContentToday:     '[SEM-CONTEUDO]',
  goalNearComplete:   '[META-QUASE]',
  inactiveStudy:      '[INATIVO]',
  lowPerformance:     '[BAIXO-REND]',
  firstContent:       '[PRIMEIRO-CONTEUDO]',
  firstEvaluation:    '[PRIMEIRA-NOTA]',
  streakAtRisk:       '[STREAK-RISCO]',
} as const;

type RuleKey = typeof RULE_KEYS[keyof typeof RULE_KEYS];

/**
 * Gera notificações automáticas com base em regras de negócio.
 * Verifica existingNotifs para evitar duplicados (não lidos com mesmo ruleKey no título).
 * Retorna as novas notificações criadas (pode ser []).
 */
export async function generateSmartNotifications(
  userId: string,
  ctx: NotifGenerationContext,
  existingNotifs: AppNotification[]
): Promise<AppNotification[]> {
  // Títulos de notificações não lidas já existentes (para anti-duplicação)
  const unreadTitles = existingNotifs
    .filter(n => !n.read)
    .map(n => n.title);

  const alreadyExists = (key: RuleKey): boolean =>
    unreadTitles.some(t => t.startsWith(key));

  const toCreate: CreateNotifPayload[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Mapeamento dia da semana para nome PT (sincronizado com scheduleService)
  const PT_WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const todayName   = PT_WEEKDAYS[new Date().getDay()];

  // ── Regra 1: Aulas registadas hoje ───────────────────────────────────────
  if (!alreadyExists(RULE_KEYS.todayLessons)) {
    const todaySlots = ctx.schedule.filter(s => s.day === todayName);
    if (todaySlots.length > 0 && todayName !== 'Domingo' && todayName !== 'Sábado') {
      const names = [...new Set(todaySlots.map(s => s.subjectName))].join(', ');
      toCreate.push({
        title:       `${RULE_KEYS.todayLessons} Hoje tens aulas de ${names.split(',')[0]}`,
        description: `O teu horário de hoje inclui: ${names}. Não te esqueças de registar os conteúdos estudados após cada aula!`,
        notifType:   'info',
      });
    }
  }

  // ── Regra 2: Nenhum conteúdo registado hoje (só se há aulas hoje) ────────
  if (!alreadyExists(RULE_KEYS.noContentToday)) {
    const todaySlots    = ctx.schedule.filter(s => s.day === todayName);
    const todayContents = ctx.contents.filter(c => c.date === today);
    if (todaySlots.length > 0 && todayContents.length === 0 && new Date().getHours() >= 14) {
      toCreate.push({
        title:       `${RULE_KEYS.noContentToday} Ainda não registaste nenhum conteúdo hoje`,
        description: 'As tuas aulas de hoje ainda não têm conteúdo registado. Faz um breve resumo para não perder o fio ao estudo!',
        notifType:   'warning',
      });
    }
  }

  // ── Regra 3: Meta perto de ser concluída (≥ 80%) ─────────────────────────
  if (!alreadyExists(RULE_KEYS.goalNearComplete)) {
    const nearDone = ctx.goals.filter(g => !g.isCompleted && (g.current / g.target) >= 0.8);
    if (nearDone.length > 0) {
      const g = nearDone[0];
      const pct = Math.round((g.current / g.target) * 100);
      toCreate.push({
        title:       `${RULE_KEYS.goalNearComplete} Falta pouco para atingires a tua meta!`,
        description: `A meta "${g.title}" está a ${pct}% de conclusão. Mais um esforço e consegues!`,
        notifType:   'success',
      });
    }
  }

  // ── Regra 4: Mais de 3 dias sem adicionar conteúdos ─────────────────────
  if (!alreadyExists(RULE_KEYS.inactiveStudy)) {
    if (ctx.contents.length > 0) {
      const lastDate   = ctx.contents.map(c => c.date).sort().reverse()[0];
      const diffDays   = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        toCreate.push({
          title:       `${RULE_KEYS.inactiveStudy} Já faz ${diffDays} dias que não estudas`,
          description: `O teu último registo de conteúdo foi há ${diffDays} dias. Mantém a regularidade para não perder o ritmo de aprendizagem!`,
          notifType:   'warning',
        });
      }
    }
  }

  // ── Regra 5: Disciplina com rendimento < 60% ──────────────────────────────
  if (!alreadyExists(RULE_KEYS.lowPerformance)) {
    const weak = ctx.subjects.filter(s => s.evaluationsCount > 0 && s.performance < 60);
    if (weak.length > 0) {
      const s = weak.sort((a, b) => a.performance - b.performance)[0];
      toCreate.push({
        title:       `${RULE_KEYS.lowPerformance} ${s.name} precisa de mais atenção`,
        description: `O teu rendimento em ${s.name} está em ${s.performance}% (média ${s.average}). Dedica mais tempo de revisão a esta disciplina.`,
        notifType:   'alert',
      });
    }
  }

  // ── Regra 6: Primeiro conteúdo registado ─────────────────────────────────
  if (!alreadyExists(RULE_KEYS.firstContent) && ctx.contents.length === 1) {
    toCreate.push({
      title:       `${RULE_KEYS.firstContent} Excelente! O teu primeiro conteúdo está registado`,
      description: 'Acabaste de registar o teu primeiro resumo de aula no Learnix. Continua assim — a consistência é a chave do sucesso académico!',
      notifType:   'success',
    });
  }

  // ── Regra 7: Primeira avaliação registada ─────────────────────────────────
  if (!alreadyExists(RULE_KEYS.firstEvaluation) && ctx.evaluations.length === 1) {
    const e = ctx.evaluations[0];
    toCreate.push({
      title:       `${RULE_KEYS.firstEvaluation} Boa! Já começaste a acompanhar as tuas notas`,
      description: `Registaste a tua primeira avaliação: ${e.gradeObtained}/${e.maxValue} em ${e.subjectName}. Continua a registar todas as notas para acompanhar a tua evolução!`,
      notifType:   'success',
    });
  }

  // ── Regra 8: Streak em risco (estudou ontem mas ainda não hoje) ───────────
  if (!alreadyExists(RULE_KEYS.streakAtRisk)) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const hadYesterday  = ctx.contents.some(c => c.date === yesterday);
    const hasToday      = ctx.contents.some(c => c.date === today);
    if (hadYesterday && !hasToday && new Date().getHours() >= 18) {
      toCreate.push({
        title:       `${RULE_KEYS.streakAtRisk} A tua sequência diária está em risco!`,
        description: 'Estudaste ontem mas ainda não registaste nenhum conteúdo hoje. Regista um resumo agora para manter a sequência!',
        notifType:   'warning',
      });
    }
  }

  if (toCreate.length === 0) return [];

  // Criar todas as notificações elegíveis em paralelo
  const created = await Promise.allSettled(
    toCreate.map(p => createNotification(userId, p))
  );

  return created
    .filter((r): r is PromiseFulfilledResult<AppNotification> => r.status === 'fulfilled')
    .map(r => r.value);
}
