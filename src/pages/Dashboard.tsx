/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dashboard.tsx — Centro de acompanhamento académico (dados reais via Supabase)
 *
 * Substituições em relação ao mock:
 *  - Data e saudação: dinâmicas (nunca hardcoded)
 *  - Médias e rendimento: via VIEW subject_stats do Supabase
 *  - Conteúdos: 5 mais recentes por data real do DB
 *  - Avaliações: 3 mais recentes por data real do DB
 *  - Horário: filtrado pelo dia da semana real
 *  - Streak: do perfil autenticado
 *  - Estados: loading, empty, error
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Award, AlertCircle, TrendingUp, FileText,
  Calendar, Sparkles, ChevronRight, PlusCircle,
  BookOpen, Loader2, BookMarked, ClipboardCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';

// ─── Tooltip personalizado do gráfico ────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-xl">
        <p className="font-extrabold">{d.name}</p>
        <p className="mt-1 font-semibold text-blue-400">
          Média: {d.Nota > 0 ? `${d.Nota} / 20.0` : 'Sem avaliações'}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Skeleton de loading ──────────────────────────────────────────────────────

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 p-4 animate-pulse ${className}`}>
    <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
    <div className="h-8 w-16 bg-slate-300 rounded mb-4" />
    <div className="h-3 w-24 bg-slate-100 rounded" />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const {
    greeting, userName, streak,
    todayLabel, todayDayName,
    overallAverage, overallPerformance,
    totalSubjects, totalContents, totalEvaluations,
    bestSubject, worstSubject,
    recentContents, recentEvaluations,
    chartData, todaySchedule,
    isLoading, hasData,
  } = useDashboard();

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho de boas-vindas ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {isLoading ? '…' : userName}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hoje é{' '}
            <span className="font-semibold text-slate-700">{todayLabel}</span>.{' '}
            Desejamos-te excelentes estudos!
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

      {/* ── Cartões principais ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Média Geral */}
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Geral</p>
              <h3 className="font-display text-3xl font-black text-blue-600 mt-2">
                {overallAverage}
              </h3>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 font-semibold">
              <TrendingUp size={14} className="mr-1 text-emerald-500" />
              <span>{totalEvaluations} avaliações registadas</span>
            </div>
          </div>
        )}

        {/* Rendimento Académico */}
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rendimento Académico</p>
              <h3 className="font-display text-3xl font-black text-emerald-600 mt-2">
                {overallPerformance > 0 ? `${overallPerformance}%` : '—'}
              </h3>
            </div>
            <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPerformance}%` }}
              />
            </div>
          </div>
        )}

        {/* Melhor Disciplina */}
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Melhor Disciplina</p>
              {bestSubject ? (
                <h3 className="font-display text-base font-bold text-slate-800 mt-2 truncate">
                  {bestSubject.name}
                </h3>
              ) : (
                <p className="text-xs text-slate-400 italic mt-2">Sem avaliações ainda</p>
              )}
            </div>
            <div className="mt-3 inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg w-max">
              <Award size={13} />
              <span>{bestSubject ? `Média ${bestSubject.average}` : '—'}</span>
            </div>
          </div>
        )}

        {/* Requer Atenção */}
        {isLoading ? <SkeletonCard /> : (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requer Atenção</p>
              {worstSubject && worstSubject.id !== bestSubject?.id ? (
                <h3 className="font-display text-base font-bold text-slate-800 mt-2 truncate">
                  {worstSubject.name}
                </h3>
              ) : (
                <p className="text-xs text-slate-400 italic mt-2">
                  {totalEvaluations === 0 ? 'Sem avaliações ainda' : 'Todas niveladas!'}
                </p>
              )}
            </div>
            <div className="mt-3 inline-flex items-center space-x-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-2 py-1 rounded-lg w-max">
              <AlertCircle size={13} />
              <span>
                {worstSubject && worstSubject.id !== bestSubject?.id
                  ? `Média ${worstSubject.average}`
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Grid de dois painéis ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* ── Coluna esquerda ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Gráfico de médias por disciplina */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Médias de Desempenho</h3>
                <p className="text-xs text-slate-400">Aproveitamento por disciplina — Escala 0 a 20</p>
              </div>
              <div className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {isLoading ? 'A carregar…' : `${totalSubjects} disciplinas`}
              </div>
            </div>

            <div className="h-64 pt-2">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-blue-300" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BookMarked size={32} className="text-slate-300" />
                  <p className="text-xs font-semibold">Cria disciplinas para ver o gráfico</p>
                </div>
              ) : (
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
              )}
            </div>
          </div>

          {/* Estatísticas rápidas */}
          {!isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Disciplinas',  value: totalSubjects,   icon: <BookOpen size={16} className="text-blue-500" /> },
                { label: 'Conteúdos',    value: totalContents,   icon: <FileText size={16} className="text-violet-500" /> },
                { label: 'Avaliações',   value: totalEvaluations,icon: <ClipboardCheck size={16} className="text-emerald-500" /> },
                { label: 'Rendimento',   value: `${overallPerformance}%`, icon: <TrendingUp size={16} className="text-amber-500" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-3">
                  <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                    <p className="font-display font-black text-slate-800 text-base">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Últimos conteúdos estudados */}
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

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 animate-pulse flex space-x-3 items-center">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 bg-slate-200 rounded-full" />
                      <div className="h-3 w-40 bg-slate-300 rounded" />
                      <div className="h-2 w-full bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentContents.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <BookMarked size={28} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-400">Nenhum conteúdo registado ainda.</p>
                <Link
                  to="/conteudos"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <PlusCircle size={13} /><span>Registar primeiro conteúdo</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContents.map(record => {
                  const sub = chartData.find(c => c.name === record.subjectName);
                  const colorHex = sub?.color ?? '#94a3b8';
                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: colorHex }}
                          >
                            {record.subjectName}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">{record.date}</span>
                          {record.isPhotoUpload && (
                            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">FOTO</span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 truncate">{record.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{record.description}</p>
                      </div>
                      <div className="shrink-0">
                        <Link
                          to="/conteudos"
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
                        >
                          Ver Resumo
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Coluna direita ──────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Horário de hoje */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Hoje na Escola</h3>
                <p className="text-xs text-slate-400">
                  Horário de aulas de {todayDayName === 'Domingo' || todayDayName === 'Sábado'
                    ? 'hoje (fim-de-semana)'
                    : todayDayName + '-feira'}
                </p>
              </div>
              <Link to="/horario" className="p-1 text-slate-400 hover:text-slate-600">
                <Calendar size={16} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 animate-pulse flex space-x-3 items-center">
                      <div className="w-2 h-8 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                        <div className="h-2 w-16 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : todaySchedule.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  {todayDayName === 'Domingo' || todayDayName === 'Sábado'
                    ? '🌴 Fim-de-semana! Aproveita para descansar.'
                    : 'Nenhuma aula agendada para hoje.'}
                </p>
              ) : (
                todaySchedule.map(slot => {
                  const sub = chartData.find(c => c.name === slot.subjectName);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-2xs hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="w-2 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.color ?? '#94a3b8' }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{slot.subjectName}</p>
                          <p className="text-[10px] text-slate-400">{slot.room || 'Sem sala'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                        {slot.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Avaliações recentes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Avaliações Recentes</h3>
                <p className="text-xs text-slate-400">As últimas notas registadas</p>
              </div>
              <Link to="/avaliacoes" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Ver tudo
              </Link>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 animate-pulse flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                      <div className="h-2 w-16 bg-slate-100 rounded" />
                    </div>
                    <div className="h-6 w-12 bg-slate-200 rounded-full" />
                  </div>
                ))
              ) : recentEvaluations.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <ClipboardCheck size={24} className="mx-auto text-slate-300" />
                  <p className="text-xs text-slate-400 font-semibold">Nenhuma avaliação ainda.</p>
                  <Link
                    to="/avaliacoes"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <PlusCircle size={12} /><span>Registar nota</span>
                  </Link>
                </div>
              ) : (
                recentEvaluations.map(ev => {
                  const sub        = chartData.find(c => c.name === ev.subjectName);
                  const colorHex   = sub?.color ?? '#94a3b8';
                  const isPassed   = (ev.gradeObtained / ev.maxValue) >= 0.5;
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{ev.subjectName}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{ev.type}</span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[9px] text-slate-400">{ev.date}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                          isPassed ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {ev.gradeObtained} / {ev.maxValue}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Banner de streak */}
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md border border-orange-500 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 blur-xs">
              <Flame size={120} className="fill-white" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center space-x-2">
                <Flame size={20} className="fill-white text-white animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-wider">Sequência Imbatível</span>
              </div>
              {streak > 0 ? (
                <>
                  <h4 className="font-display font-black text-xl leading-snug">
                    {streak} {streak === 1 ? 'Dia' : 'Dias'} a Estudar!
                  </h4>
                  <p className="text-xs text-orange-50 leading-relaxed">
                    Estás a construir um hábito de estudo sólido.{' '}
                    <span className="font-extrabold text-yellow-200">Mantém o ritmo!</span>
                  </p>
                </>
              ) : (
                <>
                  <h4 className="font-display font-black text-xl leading-snug">Começa Hoje!</h4>
                  <p className="text-xs text-orange-50 leading-relaxed">
                    Regista o teu primeiro conteúdo para iniciar a tua{' '}
                    <span className="font-extrabold text-yellow-200">sequência diária</span>.
                  </p>
                </>
              )}
              <Link
                to="/conteudos"
                className="inline-flex items-center bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition"
              >
                <span>Registar Aula</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
