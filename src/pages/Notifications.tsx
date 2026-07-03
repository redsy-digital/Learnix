/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Notifications.tsx — Central de Notificações (dados reais via Supabase)
 *
 * Substituições em relação ao mock:
 *  - Dados mock → tabela `notifications` real
 *  - markNotificationAsRead → persiste no DB (com optimistic update)
 *  - markAllNotificationsAsRead → persiste no DB
 *  - Adicionado: eliminar notificação individual
 *  - Adicionado: eliminar todas as lidas
 *  - Adicionado: loading, empty state, error state
 *  - time: "Há 2 horas" → calculado dinamicamente a partir de created_at
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell, CheckCircle, AlertTriangle, Info,
  Sparkles, Trash2, BookmarkCheck, Check,
  Loader2, RefreshCw, BellOff,
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const {
    notifications, notificationsLoading, unreadCount,
    markNotificationAsRead, markAllNotificationsAsRead,
    removeNotification, removeAllReadNotifications,
    refreshNotifications,
  } = useApp();

  const [filter, setFilter]           = useState<'all' | 'unread'>('all');
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [clearingRead, setClearingRead] = useState(false);

  const displayList = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const readCount = notifications.filter(n => n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={18} />;
      case 'success':
        return <CheckCircle className="text-emerald-500" size={18} />;
      case 'alert':
        return <Sparkles className="text-violet-600 animate-pulse" size={18} />;
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await removeNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearRead = async () => {
    setClearingRead(true);
    try {
      await removeAllReadNotifications();
    } finally {
      setClearingRead(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex items-center pr-2">
            <Bell size={22} className="text-blue-600 mr-2" />
            Central de Notificações
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lembretes automáticos gerados com base nas tuas actividades académicas.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {notificationsLoading && (
            <Loader2 size={16} className="animate-spin text-slate-400" />
          )}
          {readCount > 0 && (
            <button
              onClick={handleClearRead}
              disabled={clearingRead}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-60"
            >
              {clearingRead
                ? <Loader2 size={13} className="animate-spin" />
                : <Trash2 size={13} />
              }
              <span>Apagar lidas ({readCount})</span>
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-4 py-2 rounded-xl border border-blue-100 transition cursor-pointer"
            >
              <BookmarkCheck size={13} />
              <span>Marcar Todas Lidas</span>
            </button>
          )}
          <button
            onClick={refreshNotifications}
            disabled={notificationsLoading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Actualizar notificações"
          >
            <RefreshCw size={14} className={notificationsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Todas ({notificationsLoading ? '…' : notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            filter === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Por Ler ({notificationsLoading ? '…' : unreadCount})
        </button>
      </div>

      {/* Loading skeletons */}
      {notificationsLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse flex items-start gap-4">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-slate-200 rounded" />
                <div className="h-2.5 w-full bg-slate-100 rounded" />
                <div className="h-2.5 w-3/4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!notificationsLoading && displayList.length === 0 && (
        <div className="bg-white p-12 text-center text-slate-400 border border-slate-150 rounded-2xl space-y-3">
          {filter === 'unread' ? (
            <>
              <CheckCircle className="mx-auto text-emerald-300 mb-2.5" size={36} />
              <p className="font-bold text-slate-700">Estás em dia!</p>
              <p className="text-xs">Não tens notificações por ler. Continue assim!</p>
            </>
          ) : (
            <>
              <BellOff className="mx-auto text-slate-300 mb-2.5" size={36} />
              <p className="font-bold text-slate-700">Sem notificações ainda</p>
              <p className="text-xs max-w-xs mx-auto">
                As notificações são geradas automaticamente com base na tua actividade.
                Regista conteúdos e avaliações para começar a receber alertas.
              </p>
            </>
          )}
        </div>
      )}

      {/* Lista de notificações */}
      {!notificationsLoading && (
        <div className="space-y-3">
          {displayList.map(notif => {
            const isUnread = !notif.read;
            const isDeleting = deletingId === notif.id;

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && markNotificationAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 group ${
                  isUnread
                    ? 'bg-blue-50/20 border-blue-150 hover:border-blue-300 shadow-sm cursor-pointer'
                    : 'bg-white border-slate-150 hover:bg-slate-50/50 opacity-80'
                } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {/* Ícone */}
                <div className="pt-0.5 shrink-0">
                  {getIcon(notif.type)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-xs sm:text-sm text-slate-900 ${isUnread ? 'font-extrabold' : 'font-bold'}`}>
                      {/* Remover o prefixo de ruleKey do título para exibição */}
                      {notif.title.replace(/^\[.*?\]\s*/, '')}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap shrink-0">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {notif.description}
                  </p>
                </div>

                {/* Acções */}
                <div className="flex items-center space-x-1 shrink-0">
                  {isUnread && (
                    <button
                      onClick={e => { e.stopPropagation(); markNotificationAsRead(notif.id); }}
                      className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 transition cursor-pointer"
                      title="Marcar como lida"
                    >
                      <Check size={12} />
                    </button>
                  )}
                  <button
                    onClick={e => handleDelete(notif.id, e)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-40"
                    title="Eliminar notificação"
                  >
                    {isDeleting
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
