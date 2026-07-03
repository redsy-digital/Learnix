/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Sparkles,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Target,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Flame,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, notifications, unreadCount, logout, themeMode, setThemeMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Disciplinas', path: '/disciplinas', icon: BookOpen },
    { name: 'Conteúdos', path: '/conteudos', icon: FileText },
    { name: 'Central de Estudos', path: '/central', icon: GraduationCap },
    { name: 'Estudo com IA', path: '/estudo-ia', icon: Sparkles },
    { name: 'Horário Escolar', path: '/horario', icon: Calendar },
    { name: 'Avaliações', path: '/avaliacoes', icon: ClipboardCheck },
    { name: 'Estatísticas', path: '/estatisticas', icon: BarChart3 },
    { name: 'Metas', path: '/metas', icon: Target },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-screen z-20">
        {/* logo */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Learnix</span>
              <p className="text-[9px] -mt-1 font-semibold text-slate-400 uppercase tracking-widest">Smarter</p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Active = isActive(item.path);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  Active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <IconComponent
                  size={18}
                  className={`mr-3 transition-colors ${
                    Active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.path === '/estudo-ia' && !Active && (
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 animate-bounce">
                    IA
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions on sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-white shadow-xs border border-slate-100">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.schoolYear}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/perfil"
              className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium border transition-colors ${
                isActive('/perfil')
                  ? 'bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <User size={14} className="mr-1" />
              Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-lg text-xs font-medium bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <LogOut size={14} className="mr-1" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-6">
        {/* top header for desktop/mobile */}
        <header className="h-16 px-4 md:px-8 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          
          {/* Mobile menu toggle & brand */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 px-[6px] rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                L
              </div>
              <span className="font-display font-bold text-base bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Learnix</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Plataforma Educacional</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
              {location.pathname.substring(1) || 'Dashboard'}
            </span>
          </div>

          {/* Quick Stats: streak flame and messages */}
          <div className="flex items-center space-x-3">
            {/* Streak Indicator */}
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <Flame size={15} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>{user.streak} dias seguidos</span>
            </div>

            {/* Notification bell */}
            <Link
              to="/notificacoes"
              className="relative p-2 rounded-full hover:bg-slate-100 border border-slate-100 text-slate-600 transition-colors bg-white shadow-xs"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* quick profile link to Profile.tsx */}
            <Link to="/perfil" className="flex items-center">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover hover:ring-2 hover:ring-blue-400 transition"
              />
            </Link>
          </div>
        </header>

        {/* Mobile menu panel sliding out if checked */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            {/* overlay */}
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
            
            {/* menu menu panel */}
            <div className="relative flex flex-col w-72 bg-white h-screen shadow-2xl p-5 border-r border-slate-100">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-display font-bold text-base text-slate-800">Learnix</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 px-[6px] rounded-lg bg-slate-50 border border-slate-200 text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* contents */}
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Active = isActive(item.path);
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        Active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComponent
                        size={18}
                        className={`mr-3 ${Active ? 'text-white' : 'text-slate-400'}`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* info footer details */}
              <div className="mt-auto py-4 border-t border-slate-100">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.school}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center py-2 rounded-lg text-xs font-semibold bg-rose-550 text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  <LogOut size={14} className="mr-2" />
                  Terminar Sessão
                </button>
              </div>
            </div>
          </div>
        )}

        {/* core view insert */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* mobile bottom-navigation as required */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {menuItems.slice(0, 5).map((item) => {
          const Active = isActive(item.path);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-12 h-full transition-all relative ${
                Active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-500'
              }`}
            >
              <IconComponent size={20} className={Active ? 'scale-110' : ''} />
              <span className="text-[9px] mt-1 font-semibold tracking-tight truncate max-w-full">
                {item.name.split(' ')[0]}
              </span>
              {Active && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              )}
            </Link>
          );
        })}
        {/* toggle more navigation as overlay modal menu triggers profile directly */}
        <Link
          to="/perfil"
          className={`flex flex-col items-center justify-center w-12 h-full transition-all relative ${
            isActive('/perfil') ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <User size={20} className={isActive('/perfil') ? 'scale-110' : ''} />
          <span className="text-[9px] mt-1 font-semibold tracking-tight">Perfil</span>
          {isActive('/perfil') && (
            <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          )}
        </Link>
      </nav>
    </div>
  );
};
