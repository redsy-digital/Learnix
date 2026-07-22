/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Profile.tsx — Perfil do Utilizador (100% integrado com Supabase — Etapa 14)
 *
 * Correcções em relação à versão anterior:
 *  - targetUni: era useState local com valor hardcoded → agora lido/gravado
 *    via updateUser (campo target_uni em profiles)
 *  - notifyDaily/notifyWeekly/notifyAi: eram useState locais resetando a
 *    cada carregamento → agora lidos/gravados via updateUser
 *  - email: era um input de texto solto, nunca enviado no submit → agora
 *    tem fluxo próprio via updateEmail, que usa supabase.auth.updateUser
 *    e exige confirmação por email antes de mudar de facto (boas práticas
 *    do Supabase Auth — nunca um UPDATE directo em profiles)
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Sliders,
  Bell,
  Save,
  CheckCircle,
  Flame,
  Moon,
  Sun,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  MailCheck,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUser, updateEmail, themeMode, setThemeMode } = useApp();

  // ── Formulário de dados de conta (sem email — ver secção própria) ─────────
  const [name, setName]             = useState(user.name);
  const [schoolYear, setSchoolYear] = useState(user.schoolYear);
  const [school, setSchool]         = useState(user.school);
  const [targetUni, setTargetUni]   = useState(user.targetUni);

  // Reidratar o formulário se o perfil ainda carregar depois do primeiro render
  // (ex: refresh da página — user.* chega em pequeno atraso via AuthContext)
  useEffect(() => {
    setName(user.name);
    setSchoolYear(user.schoolYear);
    setSchool(user.school);
    setTargetUni(user.targetUni);
  }, [user.name, user.schoolYear, user.school, user.targetUni]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError]   = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ── Alteração de email (fluxo próprio, com confirmação) ───────────────────
  const [emailInput, setEmailInput]       = useState(user.email);
  const [savingEmail, setSavingEmail]     = useState(false);
  const [emailError, setEmailError]       = useState<string | null>(null);
  const [emailRequested, setEmailRequested] = useState(false);

  useEffect(() => { setEmailInput(user.email); }, [user.email]);

  // ── Preferências de notificação (reais, persistidas) ──────────────────────
  const [notifyDaily, setNotifyDaily]   = useState(user.notifyDaily);
  const [notifyWeekly, setNotifyWeekly] = useState(user.notifyWeekly);
  const [notifyAi, setNotifyAi]         = useState(user.notifyAi);
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    setNotifyDaily(user.notifyDaily);
    setNotifyWeekly(user.notifyWeekly);
    setNotifyAi(user.notifyAi);
  }, [user.notifyDaily, user.notifyWeekly, user.notifyAi]);

  // ── Guardar dados de conta ─────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);
    try {
      await updateUser({ name, schoolYear, school, targetUni });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erro ao guardar. Tenta novamente.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Solicitar alteração de email ───────────────────────────────────────────
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailRequested(false);
    if (emailInput.trim() === user.email) return;
    setSavingEmail(true);
    try {
      await updateEmail(emailInput.trim());
      setEmailRequested(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erro ao solicitar alteração de email.');
    } finally {
      setSavingEmail(false);
    }
  };

  // ── Guardar preferências de notificação imediatamente ao alternar ─────────
  const handleToggleNotify = async (
    field: 'notifyDaily' | 'notifyWeekly' | 'notifyAi',
    value: boolean
  ) => {
    const setters = { notifyDaily: setNotifyDaily, notifyWeekly: setNotifyWeekly, notifyAi: setNotifyAi };
    setters[field](value); // optimistic update
    setSavingNotifs(true);
    try {
      await updateUser({ [field]: value });
    } catch {
      setters[field](!value); // reverter em caso de falha
    } finally {
      setSavingNotifs(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Upper Profile banner */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative">
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-white text-[10px] font-bold backdrop-blur-xs">
            <ShieldCheck size={12} />
            <span>Conta Verificada</span>
          </div>
        </div>

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

      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Coluna esquerda: dados de conta + email */}
        <div className="lg:col-span-7 space-y-6">

          {/* Formulário de dados de conta */}
          <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b">
              <User size={18} className="text-blue-600" />
              <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">Dados de Conta</h3>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
                <CheckCircle size={14} className="shrink-0" />
                <span>Perfil guardado com sucesso!</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome de Utilizador
                </label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  disabled={savingProfile}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ano Escolar / Turma
                </label>
                <input
                  type="text" required value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)}
                  disabled={savingProfile}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Estabelecimento de Ensino
              </label>
              <input
                type="text" required value={school} onChange={(e) => setSchool(e.target.value)}
                disabled={savingProfile}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Objetivo Académico (Universidade / Curso Alvo)
              </label>
              <input
                type="text" value={targetUni} onChange={(e) => setTargetUni(e.target.value)}
                placeholder="ex. Faculdade de Ciências — Bioquímica"
                disabled={savingProfile}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold disabled:opacity-60"
              />
            </div>

            <button
              type="submit" disabled={savingProfile}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              {savingProfile
                ? <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
                : <><Save size={14} /><span>Guardar Dados de Conta</span></>
              }
            </button>
          </form>

          {/* Alteração de email — fluxo próprio com confirmação */}
          <form onSubmit={handleRequestEmailChange} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b">
              <Mail size={18} className="text-indigo-600" />
              <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">Endereço de Email</h3>
            </div>

            {emailRequested && (
              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold rounded-xl flex items-start space-x-2">
                <MailCheck size={14} className="shrink-0 mt-0.5" />
                <span>Enviámos um link de confirmação para "{emailInput}". O teu email só muda depois de clicares nesse link.</span>
              </div>
            )}
            {emailError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Actual: <span className="text-slate-600 normal-case">{user.email}</span>
              </label>
              <input
                type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                disabled={savingEmail}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">
                Ao alterar, receberás um email de confirmação no novo endereço antes da mudança ser efectivada.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingEmail || emailInput.trim() === user.email || !emailInput.trim()}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              {savingEmail
                ? <><Loader2 size={14} className="animate-spin" /><span>A processar…</span></>
                : <><Mail size={14} /><span>Solicitar Alteração de Email</span></>
              }
            </button>
          </form>
        </div>

        {/* Coluna direita: tema + notificações */}
        <div className="lg:col-span-5 space-y-6">

          {/* Preferências visuais (já estava conectado — inalterado) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
              <Sliders size={16} className="text-violet-600 mr-2" /> Preferências Visuais
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold leading-normal">
              <button
                type="button" onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'light' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sun size={15} /><span>Tema Claro</span>
              </button>
              <button
                type="button" onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'dark' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Moon size={15} /><span>Tema Escuro</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">Disponível em toda a estrutura de layouts Learnix para estudo noturno.</p>
          </div>

          {/* Preferências de notificação — agora reais e persistidas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
                <Bell size={16} className="text-indigo-600 mr-2" /> Preferências de Lembrete
              </h3>
              {savingNotifs && <Loader2 size={13} className="animate-spin text-slate-300" />}
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Lembrete Diário de Sumários</span>
                  <p className="text-[10px] text-slate-400">Recebe notificações se esqueceres de registrar aulas.</p>
                </div>
                <input
                  type="checkbox" checked={notifyDaily}
                  onChange={(e) => handleToggleNotify('notifyDaily', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Progresso Semanal de Metas</span>
                  <p className="text-[10px] text-slate-400">Notificar-me sobre o progresso das minhas metas activas.</p>
                </div>
                <input
                  type="checkbox" checked={notifyWeekly}
                  onChange={(e) => handleToggleNotify('notifyWeekly', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-slate-700">Tutor de IA Integrado</span>
                  <p className="text-[10px] text-slate-400">Receber alertas e recomendações geradas pela IA.</p>
                </div>
                <input
                  type="checkbox" checked={notifyAi}
                  onChange={(e) => handleToggleNotify('notifyAi', e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
