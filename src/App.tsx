/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './components/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { Contents } from './pages/Contents';
import { StudyCenter } from './pages/StudyCenter';
import { AIStudy } from './pages/AIStudy';
import { Schedule } from './pages/Schedule';
import { Evaluations } from './pages/Evaluations';
import { Statistics } from './pages/Statistics';
import { Goals } from './pages/Goals';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';

// ─── Loading screen ────────────────────────────────────────────────────────
// Exibido enquanto o Supabase verifica se existe sessão activa.
// Evita o "flash" de rota errada no carregamento inicial.
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg animate-pulse">
        <span className="text-white font-bold text-xl">L</span>
      </div>
      <p className="text-sm font-semibold text-slate-400 animate-pulse">A carregar…</p>
    </div>
  </div>
);

// ─── ProtectedRoute ────────────────────────────────────────────────────────
// Aguarda a confirmação da sessão antes de redirecionar.
// Sem o isLoading, haveria um flash para /login no carregamento inicial.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

// ─── GuestRoute ────────────────────────────────────────────────────────────
// Impede utilizadores autenticados de aceder à Landing/Login.
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// ─── Routes ────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Rotas públicas */}
    <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

    {/* Rotas protegidas */}
    <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/disciplinas"  element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
    <Route path="/conteudos"    element={<ProtectedRoute><Contents /></ProtectedRoute>} />
    <Route path="/central"      element={<ProtectedRoute><StudyCenter /></ProtectedRoute>} />
    <Route path="/estudo-ia"    element={<ProtectedRoute><AIStudy /></ProtectedRoute>} />
    <Route path="/horario"      element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
    <Route path="/avaliacoes"   element={<ProtectedRoute><Evaluations /></ProtectedRoute>} />
    <Route path="/estatisticas" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
    <Route path="/metas"        element={<ProtectedRoute><Goals /></ProtectedRoute>} />
    <Route path="/notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/perfil"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ─── App root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    // AuthProvider envolve tudo — a sessão Supabase está disponível em toda a árvore
    // AppProvider fica dentro — pode (futuramente) usar o utilizador autenticado
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
