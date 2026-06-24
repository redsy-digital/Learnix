/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
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

// Helper component to guard authenticated pages
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Helper component to guard guest-only pages
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useApp();
  
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal (Guest routes) */}
          <Route
            path="/"
            element={
              <GuestRoute>
                <LandingPage />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          {/* Secure App routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disciplinas"
            element={
              <ProtectedRoute>
                <Subjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conteudos"
            element={
              <ProtectedRoute>
                <Contents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/central"
            element={
              <ProtectedRoute>
                <StudyCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudo-ia"
            element={
              <ProtectedRoute>
                <AIStudy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/horario"
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/avaliacoes"
            element={
              <ProtectedRoute>
                <Evaluations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estatisticas"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/metas"
            element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route redirects home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
