/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  School,
  Mail,
  Sliders,
  Bell,
  Sparkles,
  Save,
  CheckCircle,
  Eye,
  Settings,
  Flame,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUser, themeMode, setThemeMode } = useApp();

  // Form states matching current user details
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [schoolYear, setSchoolYear] = useState(user.schoolYear);
  const [school, setSchool] = useState(user.school);
  const [targetUni, setTargetUni] = useState('Faculdade de Ciências - Bioquímica ou Medicina');

  // Push notifications states
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyAi, setNotifyAi] = useState(true);

  // Success alert
  const [success, setSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      schoolYear,
      school
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Upper Profile banner */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
        
        {/* abstract color banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-650 to-violet-600 relative">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-white text-[10px] font-bold backdrop-blur-xs">
            <ShieldCheck size={12} />
            <span>ID Secundário Ativo</span>
          </div>
        </div>

        {/* avatar and user identifiers */}
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 -mt-10">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md shrink-0"
            />
            <div className="text-center sm:text-left">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{user.name}</h1>
              <p className="text-xs text-slate-500 mt-1">{user.schoolYear} • {user.school}</p>
            </div>
          </div>

          <div className="self-center sm:self-auto bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1 border border-amber-100">
            <Flame size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
            <span>{user.streak} dias estudados seguidos</span>
          </div>
        </div>
      </div>

      {/* Grid customization options */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: input details form update */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b">
            <User size={18} className="text-blue-650 text-blue-600" />
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">Configurações de Conta</h3>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-pulse">
              Perfil e preferências salvos com sucesso!
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nome de Utilizador
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Endereço de Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Ano Escolar / Turma
              </label>
              <input
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Estabelecimento de Ensino
              </label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Objetivo Académico (Universidade / Curso Alvo)
            </label>
            <input
              type="text"
              value={targetUni}
              onChange={(e) => setTargetUni(e.target.value)}
              className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
            />
          </div>

          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Save size={14} />
            <span>Guardar Configurações</span>
          </button>
        </form>

        {/* Right column: theme settings & preferences push toggle */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Visual Preferences */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-805 text-sm flex items-center">
              <Sliders size={16} className="text-violet-600 mr-2" /> Preferências Visuais
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold leading-normal">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sun size={15} />
                <span>Tema Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Moon size={15} />
                <span>Tema Escuro</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">Disponível em toda a estrutura de layouts Learnix para estudo noturno.</p>
          </div>

          {/* Push notification settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-805 text-sm flex items-center">
              <Bell size={16} className="text-indigo-600 mr-2" /> Preferências de Lembrete
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Lembrete Diário de Sumários</span>
                  <p className="text-[10px] text-slate-400">Recebe notificações se esqueceres de registrar aulas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                  className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Progresso Trimestral de Metas</span>
                  <p className="text-[10px] text-slate-400">Notificar-me quando atingir 50% de metas salvas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeekly}
                  onChange={(e) => setNotifyWeekly(e.target.checked)}
                  className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Tutor de IA Integrado</span>
                  <p className="text-[10px] text-slate-400">Permitir que a IA analise fórmulas complexas de Química.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAi}
                  onChange={(e) => setNotifyAi(e.target.checked)}
                  className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
