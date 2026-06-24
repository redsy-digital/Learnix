/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Award,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  PlusCircle,
  BookOpen
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, subjects, contents, schedule, evaluations, goals } = useApp();

  // Get current day of week in Portuguese
  // In Portuguese: "Segunda", "Terça", "Quarta", "Quinta", "Sexta" etc.
  const currentDayName = 'Segunda'; // Based on real date June 22, 2026 which is Monday

  // Filter schedule for today
  const dailySchedule = schedule.filter((slot) => slot.day === currentDayName);

  // Calculate overall performance
  const validSubjects = subjects.filter((s) => s.evaluationsCount > 0);
  const totalAverage = subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length;
  const overallAverageFormatted = totalAverage.toFixed(1);
  const overallPerformance = Math.round(subjects.reduce((sum, s) => sum + s.performance, 0) / subjects.length);

  // Find best and worst subject
  const sortedSubjects = [...subjects].sort((a, b) => b.average - a.average);
  const bestSubject = sortedSubjects[0];
  const worstSubject = sortedSubjects[sortedSubjects.length - 1];

  // Get latest 3 contents added
  const recentContents = contents.slice(0, 3);

  // Get upcoming 3 evaluations sorted by date (mocking nearest future evaluations)
  const upcomingEvaluations = evaluations
    .filter((e) => new Date(e.date) >= new Date('2026-06-15')) // recent or upcoming
    .slice(0, 3);

  const chartData = subjects.map((sub) => ({
    name: sub.name,
    Nota: sub.average,
    color: sub.colorHex,
  }));

  // Simple custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-xl">
          <p className="font-extrabold">{data.name}</p>
          <p className="mt-1 font-semibold text-blue-400">Média: {data.Nota} / 20.0</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Olá, {user.name}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hoje é <span className="font-semibold text-slate-700">Segunda-feira, 22 de Junho de 2026</span>. Desejamos-te excelentes estudos para hoje!
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/conteudos"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <PlusCircle size={16} />
            <span>Registar Aprendizado</span>
          </Link>
          <Link
            to="/estudo-ia"
            className="flex items-center space-x-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-sm px-4 py-2.5 rounded-xl border border-violet-150 transition"
          >
            <Sparkles size={16} className="text-violet-500 fill-violet-500" />
            <span>Tutor IA</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Average Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Geral</p>
            <h3 className="font-display text-3xl font-black text-blue-600 mt-2">{overallAverageFormatted}</h3>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-bold">
            <TrendingUp size={14} className="mr-1" />
            <span>+0.4 valores este mês</span>
          </div>
        </div>

        {/* Global Efficiency Percent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rendimento Académico</p>
            <h3 className="font-display text-3xl font-black text-emerald-600 mt-2">{overallPerformance}%</h3>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallPerformance}%` }}></div>
          </div>
        </div>

        {/* Best Subject card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Melhor Disciplina</p>
            <h3 className="font-display text-base font-bold text-slate-800 mt-2 truncate">{bestSubject?.name}</h3>
          </div>
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg w-max">
            <Award size={13} />
            <span>Média {bestSubject?.average}</span>
          </div>
        </div>

        {/* Attention needed card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requer Atenção</p>
            <h3 className="font-display text-base font-bold text-slate-800 mt-2 truncate">{worstSubject?.name}</h3>
          </div>
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-2 py-1 rounded-lg w-max">
            <AlertCircle size={13} />
            <span>Média {worstSubject?.average}</span>
          </div>
        </div>
      </div>

      {/* Two columns layout for charts/schedules & tasks */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left main: Chart & Recent studies */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chart Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Médias de Desempenho</h3>
                <p className="text-xs text-slate-400">Visão geral do aproveitamento por disciplina (Escala 0 a 20)</p>
              </div>
              <div className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Atualizado agora
              </div>
            </div>

            {/* Recharts chart render */}
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 20]}
                    tickCount={5}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Nota" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Contents studied */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Últimos Conteúdos Estudados</h3>
                <p className="text-xs text-slate-400">Sumários e fichas que registaste recentemente</p>
              </div>
              <Link
                to="/conteudos"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>Ver todos</span>
                <ChevronRight size={14} className="ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentContents.map((record) => {
                const sub = subjects.find((s) => s.id === record.subjectId);
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white`} style={{ backgroundColor: sub?.colorHex || '#94a3b8' }}>
                          {record.subjectName}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">{record.date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 truncate">{record.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {record.description}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <Link
                        to="/conteudos"
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
                      >
                        Ler Resumo
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right main: Daily subject classes & Quick widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Daily Schedule Mon */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Hoje na Escola</h3>
                <p className="text-xs text-slate-400">Horário de aulas para Segunda-feira</p>
              </div>
              <Link to="/horario" className="p-1 text-slate-400 hover:text-slate-600">
                <Calendar size={16} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {dailySchedule.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">Nenhuma aula agendada para hoje.</p>
              ) : (
                dailySchedule.map((slot) => {
                  const sub = subjects.find((s) => s.id === slot.subjectId);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs group hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="w-2 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.colorHex || '#bbb' }}
                        ></div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{slot.subjectName}</p>
                          <p className="text-[10px] text-slate-400">{slot.room || 'Sem sala'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {slot.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming assessments / tasks */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Próximas Avaliações</h3>
                <p className="text-xs text-slate-400">Exames e fichas agendados</p>
              </div>
              <Link
                to="/avaliacoes"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Ver tudo
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvaluations.map((evalItem) => {
                const sub = subjects.find((s) => s.id === evalItem.subjectId);
                return (
                  <div
                    key={evalItem.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-55/65 transition flex items-center justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{evalItem.subjectName}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{evalItem.type}</span>
                        <span className="text-[9px] text-slate-400">•</span>
                        <span className="text-[9px] text-slate-400">{evalItem.date}</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-extrabold text-white px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: sub?.colorHex || '#94a3b8' }}
                    >
                      Nota {evalItem.gradeObtained}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak Motivator banner */}
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md border border-orange-500 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 blur-xs">
              <Flame size={120} className="fill-white" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center space-x-2">
                <Flame size={20} className="fill-white text-white animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-wider">Sequência Imbatível</span>
              </div>
              <h4 className="font-display font-black text-xl leading-snug">6 Dias Estudando!</h4>
              <p className="text-xs text-orange-50 leading-relaxed">
                Estás a apenas <span className="font-extrabold text-yellow-200">1 registro</span> de estender a tua sequência diária para 7 dias. Adiciona um resumo hoje!
              </p>
              <Link
                to="/conteudos"
                className="inline-flex items-center bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition"
              >
                <span>Registrar Aula</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
