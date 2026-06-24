/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Trash2,
  BookmarkCheck,
  Check,
  ChevronRight
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayList = filter === 'all'
    ? notifications
    : notifications.filter((n) => !n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-amber-500 fill-amber-50" size={18} />;
      case 'success':
        return <CheckCircle className="text-emerald-500 fill-emerald-50" size={18} />;
      case 'alert':
        return <Sparkles className="text-violet-600 fill-violet-50 animate-pulse" size={18} />;
      default:
        return <Info className="text-blue-500 fill-blue-50" size={18} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex items-center pr-2">
            <Bell size={22} className="text-blue-600 mr-2" /> Central de Notificações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recebe lembretes de metas, avisos escolares de disciplinas e novos conteúdos preparados pela IA.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <BookmarkCheck size={14} />
            <span>Marcar Todas como Lidas</span>
          </button>
        )}
      </div>

      {/* Tabs list filter */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer ${
            filter === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
          }`}
        >
          Por Ler ({unreadCount})
        </button>
      </div>

      {/* List items representation */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 border border-slate-150 rounded-2xl">
            <CheckCircle className="mx-auto text-slate-200 mb-2.5" size={32} />
            <p className="font-semibold text-sm">Sem alertas ativos de momento</p>
            <p className="text-xs">Estás perfeitamente em dia com todas as tuas metas e resumos!</p>
          </div>
        ) : (
          displayList.map((notif) => {
            const isUnread = !notif.read;
            return (
              <div
                key={notif.id}
                onClick={() => isUnread && markNotificationAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  isUnread
                    ? 'bg-blue-50/20 border-blue-150 hover:border-blue-300 shadow-sm'
                    : 'bg-white border-slate-150 hover:bg-slate-55/15 opacity-80'
                } ${isUnread ? 'cursor-pointer' : ''}`}
              >
                {/* Icon indicator */}
                <div className="pt-0.5 shrink-0">
                  {getIcon(notif.type)}
                </div>

                {/* Details layout */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-xs sm:text-sm text-slate-900 ${isUnread ? 'font-extrabold' : 'font-bold'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {notif.description}
                  </p>
                </div>

                {/* Quick select trigger */}
                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notif.id);
                    }}
                    className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-800 transition"
                  >
                    <Check size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
