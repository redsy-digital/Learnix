/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  Users,
  Award
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMess, setErrorMess] = useState('');
  const [successMess, setSuccessMess] = useState('');

  const handleGoogleSignIn = () => {
    login('contact.redsy.digital@gmail.com');
    navigate('/dashboard');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');
    setSuccessMess('');

    if (authMode === 'signin') {
      if (!email || !password) {
        setErrorMess('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      login(email);
      navigate('/dashboard');
    } else if (authMode === 'signup') {
      if (!name || !email || !password) {
        setErrorMess('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      // Simulate registering name
      login(email);
      navigate('/dashboard');
    } else {
      if (!email) {
        setErrorMess('Introduza um email válido.');
        return;
      }
      setSuccessMess('Instruções de recuperação enviadas para o email indicado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Back button to public portal */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3.5 py-1.8 rounded-xl shadow-xs transition"
        >
          <ChevronLeft size={14} />
          <span>Voltar ao Portal</span>
        </Link>
      </div>

      {/* Left Column - Forms */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white shadow-xs z-10">
        <div className="mx-auto w-full max-w-sm">
          
          {/* logo */}
          <div className="flex items-center space-x-2.5 mb-10 max-w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-slate-800">Learnix</span>
              <p className="text-[10px] -mt-1 font-bold text-slate-400 tracking-wider">Apoio Autónomo</p>
            </div>
          </div>

          {/* headers */}
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

          {/* form notifications messages */}
          {errorMess && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 mb-6 animate-pulse">
              {errorMess}
            </div>
          )}
          {successMess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 mb-6">
              {successMess}
            </div>
          )}

          {/* core input fields */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Gabriel Rodrigues"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Endereço de Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudante@learnix.pt"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
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
                      onClick={() => setAuthMode('forgot')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Esqueceu-se?
                    </button>
                  )}
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-100 transition whitespace-nowrap pt-3 cursor-pointer"
            >
              <span>
                {authMode === 'signin' && 'Aceder à Minha Área'}
                {authMode === 'signup' && 'Começar a Aprender'}
                {authMode === 'forgot' && 'Enviar Link de Reset'}
              </span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Social connections separator */}
          {authMode !== 'forgot' && (
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-150"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Ou continuar com</span>
              </div>
            </div>
          )}

          {/* Google SSO button */}
          {authMode !== 'forgot' && (
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition cursor-pointer"
            >
              {/* Simple inline Google G logo icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm">Entrar com o Google</span>
            </button>
          )}

          {/* toggle footer modes link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            {authMode === 'signin' && (
              <p>
                Não tem uma conta armada?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
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
                  onClick={() => setAuthMode('signin')}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Inicie Sessão
                </button>
              </p>
            )}
            {authMode === 'forgot' && (
              <button
                onClick={() => setAuthMode('signin')}
                className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 hover:underline"
              >
                <ChevronLeft size={14} />
                <span>Voltar para o Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Brand Illustration & Testimonial */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-tr from-blue-700 to-indigo-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background bubbles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* quote decoration */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
            <GraduationCap size={14} />
            <span>Educação Inteligente</span>
          </div>
          <h3 className="font-display text-4xl font-extrabold tracking-tight leading-tight">
            "Learn smarter,<br /> grow faster."
          </h3>
        </div>

        {/* mock mockup floating badge dashboard in dark theme */}
        <div className="my-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-slate-900 shadow">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Atingiu Streak Diário</p>
              <p className="text-[11px] text-slate-300">Gabriel completou 6 dias de meta escolar seguida</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>Biologia: Divisão celular</span>
              <span className="text-emerald-450 text-emerald-400 font-bold">+18.0v</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>

        {/* testimonial widget */}
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
