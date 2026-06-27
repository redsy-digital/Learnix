/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Login.tsx — Autenticação real via Supabase Auth
 *
 * Substituições em relação ao mock:
 *  - login(email) → signInWithEmail(email, password) real
 *  - signup simulado → signUpWithEmail(email, password, name) real
 *  - forgot simulado → resetPassword(email) real (envia email via Supabase)
 *  - handleGoogleSignIn com email hardcoded → removido
 *  - Erros traduzidos para português pelo AuthContext
 *  - Estado de loading durante chamadas assíncronas
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  Award,
  Loader2,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, resetPassword, authError, clearAuthError } = useAuth();

  const [authMode, setAuthMode]     = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail]           = useState('');
  const [name, setName]             = useState('');
  const [password, setPassword]     = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [successMess, setSuccessMess] = useState('');

  // Limpar erros ao mudar de modo
  const switchMode = (mode: 'signin' | 'signup' | 'forgot') => {
    clearAuthError();
    setSuccessMess('');
    setAuthMode(mode);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSuccessMess('');
    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        // Login real — o onAuthStateChange do AuthContext trata o redirecionamento
        await signInWithEmail(email, password);
        // Não é necessário navigate() — o GuestRoute detecta isLoggedIn e redireciona

      } else if (authMode === 'signup') {
        await signUpWithEmail(email, password, name);
        // Supabase pode exigir confirmação de email dependendo das settings do projecto
        setSuccessMess(
          'Conta criada! Verifica o teu email para confirmar o registo e depois inicia sessão.'
        );
        switchMode('signin');

      } else {
        // Recuperação de senha — envia email real via Supabase Auth
        await resetPassword(email);
        setSuccessMess(
          'Email de recuperação enviado! Verifica a tua caixa de entrada e segue as instruções.'
        );
      }
    } catch {
      // O erro já está em authError (definido pelo AuthContext)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* Botão voltar ao portal */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm transition"
        >
          <ChevronLeft size={14} />
          <span>Voltar ao Portal</span>
        </Link>
      </div>

      {/* Coluna esquerda — formulários */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white shadow-sm z-10">
        <div className="mx-auto w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center space-x-2.5 mb-10 max-w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-slate-800">Learnix</span>
              <p className="text-[10px] -mt-1 font-bold text-slate-400 tracking-wider">Apoio Autónomo</p>
            </div>
          </div>

          {/* Cabeçalhos */}
          <div className="space-y-2 mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {authMode === 'signin' && 'Bem-vindo ao Learnix! 👋'}
              {authMode === 'signup' && 'Começa o teu percurso 🚀'}
              {authMode === 'forgot' && 'Recuperar senha 🔐'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {authMode === 'signin' && 'Inicia sessão para continuar os teus estudos com inteligência artificial.'}
              {authMode === 'signup' && 'Cria a tua conta hoje mesmo e simplifica as tuas revisões académicas.'}
              {authMode === 'forgot' && 'Insere o teu endereço de email para obteres um link seguro de reset.'}
            </p>
          </div>

          {/* Mensagens de erro (do AuthContext) e sucesso */}
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 mb-6">
              {authError}
            </div>
          )}
          {successMess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 mb-6">
              {successMess}
            </div>
          )}

          {/* Formulário */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Ana Rodrigues"
                    disabled={isLoading}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Endereço de Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudante@learnix.pt"
                  disabled={isLoading}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Palavra-passe
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Esqueceu-se?
                    </button>
                  )}
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    disabled={isLoading}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                  />
                </div>
                {authMode === 'signup' && (
                  <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Mínimo de 6 caracteres.</p>
                )}
              </div>
            )}

            {/* Botão de submissão */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>A processar…</span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === 'signin' && 'Aceder à Minha Área'}
                    {authMode === 'signup' && 'Começar a Aprender'}
                    {authMode === 'forgot' && 'Enviar Link de Reset'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Alternância de modo */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {authMode === 'signin' && (
              <p>
                Não tem uma conta?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Registe-se Grátis
                </button>
              </p>
            )}
            {authMode === 'signup' && (
              <p>
                Já possui uma conta Learnix?{' '}
                <button
                  onClick={() => switchMode('signin')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Inicie Sessão
                </button>
              </p>
            )}
            {authMode === 'forgot' && (
              <button
                onClick={() => switchMode('signin')}
                className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 hover:underline"
              >
                <ChevronLeft size={14} />
                <span>Voltar para o Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coluna direita — painel decorativo (inalterado) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-tr from-blue-700 to-indigo-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="space-y-4">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <GraduationCap size={14} />
            <span>Educação Inteligente</span>
          </div>
          <h3 className="font-display text-4xl font-extrabold tracking-tight leading-tight">
            "Learn smarter,<br /> grow faster."
          </h3>
        </div>

        <div className="my-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900 shadow">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Streak Diário Ativo</p>
              <p className="text-[11px] text-slate-300">Mantém a sequência e maximiza o teu rendimento</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>Biologia: Divisão celular</span>
              <span className="text-emerald-400 font-bold">+18.0v</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t border-white/10 pt-6">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
            alt="Beatriz"
            className="w-11 h-11 rounded-full border border-white/20 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/80 leading-relaxed font-semibold italic">
              "A inteligência artificial ajuda-me a consolidar cada disciplina. É extremamente simples!"
            </p>
            <p className="text-[11px] font-bold text-amber-300 mt-1">Beatriz Almeida, 11º Ano</p>
          </div>
        </div>
      </div>
    </div>
  );
};
