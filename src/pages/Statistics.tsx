/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Statistics.tsx — Página de Estatísticas (dados reais via Supabase)
 *
 * Substituições em relação ao mock:
 *  - Todos os cálculos movidos para useStatistics / statisticsService
 *  - "História" hardcoded → insight dinâmico baseado em dados reais
 *  - "+4.2%" hardcoded → evolução calculada a partir de avaliações reais
 *  - Filtros de período funcionais (30d, 90d, ano, todo)
 *  - Filtro por disciplina no gráfico de notas
 *  - Conteúdos por mês e por disciplina (novos gráficos)
 *  - Secção de Insights inteligentes (sem IA, baseados em regras)
 *  - Loading, empty state, error state
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Award, AlertTriangle, Sparkles,
  BarChart2, BookOpen, Target, CheckCircle,
  FileText, ClipboardCheck, Loader2, BookMarked,
  Lightbulb, ListFilter,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import { useStatistics } from '../hooks/useStatistics';
import type { PeriodFilter } from '../services/statisticsService';

// ─── Tooltip personalizado ────────────────────────────────────────────────────

const GradeTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs shadow-xl">
        <p className="font-extrabold">{d.Materia}</p>
        <p className="text-[10px] text-slate-400 mb-1">{d.isoDate}</p>
        <p className="font-semibold text-blue-400">Nota: {d.Nota} / 20.0</p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs shadow-xl">
        <p className="font-extrabold">{d.name}</p>
        <p className="font-semibold text-blue-400 mt-1">
          {payload[0].dataKey === 'Media'
            ? `Média: ${d.Media} / 20.0`
            : `Conteúdos: ${d.total}`}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Labels de período ────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '30d':  'Últimos 30 dias',
  '90d':  'Últimos 90 dias',
  'year': 'Ano lectivo',
  'all':  'Todo o histórico',
};

// ─── Cor do insight ───────────────────────────────────────────────────────────

const INSIGHT_STYLES = {
  success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  warning: 'bg-amber-50  border-amber-100  text-amber-800',
  info:    'bg-blue-50   border-blue-100   text-blue-800',
  tip:     'bg-violet-50 border-violet-100 text-violet-800',
};

const INSIGHT_ICONS = {
  success: <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />,
  warning: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
  info:    <Lightbulb size={15} className="text-blue-500 shrink-0 mt-0.5" />,
  tip:     <Sparkles size={15} className="text-violet-500 shrink-0 mt-0.5" />,
};

// ─── Skeleton de loading ──────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

// ─── Componente principal ─────────────────────────────────────────────────────

export const Statistics: React.FC = () => {
  const {
    period, setPeriod,
    filterSubjectId, setFilterSubjectId,
    overview, subjectStats, gradeEvolution,
    contentsByMonth, contentsBySubject,
    goalStats, insights,
    subjects,
    isLoading, hasData,
  } = useStatistics();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Análise de Desempenho e Estatísticas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Relatórios gerados automaticamente a partir dos teus dados académicos reais.
        </p>
      </div>

      {/* Empty state global */}
      {!isLoading && !hasData && (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <BookMarked size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Sem dados para analisar ainda</p>
            <p className="text-xs text-slate-400 mt-1">
              Cria disciplinas, regista conteúdos e avaliações para começar a ver as tuas estatísticas.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Link to="/disciplinas" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">
              Criar Disciplinas
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/conteudos" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">
              Registar Conteúdos
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/avaliacoes" className="text-xs font-bold text-blue-600 hover:text-blue-700 underline">
              Adicionar Avaliações
            </Link>
          </div>
        </div>
      )}

      {/* Cartões de visão geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <FileText size={11} /><span>Aulas Registadas</span>
              </p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{overview.totalContents}</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                {overview.studyDays} dias de estudo · {overview.avgWeeklyContents}/semana
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <ClipboardCheck size={11} /><span>Avaliações</span>
              </p>
              <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{overview.totalEvaluations}</h3>
              <p className="text-[10px] text-blue-600 mt-2 font-semibold">
                {overview.totalSubjects} disciplinas activas
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <TrendingUp size={11} /><span>Média Geral Global</span>
              </p>
              <h3 className="font-display text-2xl font-black text-blue-600 mt-1">
                {overview.overallAverage}
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                {overview.overallPerformance > 0 ? `${overview.overallPerformance}% rendimento` : 'Sem avaliações'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <Target size={11} /><span>Metas</span>
              </p>
              <h3 className="font-display text-2xl font-black text-emerald-600 mt-1">
                {goalStats.completionRate}%
              </h3>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">
                {goalStats.completed}/{goalStats.total} concluídas · {goalStats.active} activas
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Coluna esquerda — gráficos */}
        <div className="lg:col-span-8 space-y-6">

          {/* Gráfico: Cronologia de notas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 flex items-center">
                  <TrendingUp size={16} className="text-emerald-500 mr-2" />
                  Cronologia de Resultados
                </h3>
                <p className="text-xs text-slate-400">Evolução das notas ao longo do tempo</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center shrink-0">
                {/* Filtro disciplina */}
                <div className="flex items-center space-x-1">
                  <ListFilter size={13} className="text-slate-400" />
                  <select
                    value={filterSubjectId}
                    onChange={e => setFilterSubjectId(e.target.value)}
                    className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="all">Todas</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {/* Filtro período */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  {(['30d', '90d', 'year', 'all'] as PeriodFilter[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        period === p ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p === '30d' ? '30D' : p === '90d' ? '90D' : p === 'year' ? 'Ano' : 'Tudo'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-64 pt-2">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-blue-300" />
                </div>
              ) : gradeEvolution.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <ClipboardCheck size={32} className="text-slate-300" />
                  <p className="text-xs font-semibold">Sem avaliações para o período "{PERIOD_LABELS[period]}"</p>
                  <Link to="/avaliacoes" className="text-xs font-bold text-blue-600 hover:underline">
                    Registar avaliação
                  </Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gradeEvolution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} tickCount={5} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GradeTooltip />} />
                    <Area type="monotone" dataKey="Nota" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorGrade)" dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico: Médias por disciplina */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 flex items-center">
                <BarChart2 size={16} className="text-blue-500 mr-2" /> Médias Comparativas por Disciplina
              </h3>
              <p className="text-xs text-slate-400">Médias da VIEW subject_stats — calculadas pelo Supabase em tempo real</p>
            </div>
            <div className="h-56 pt-2">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-blue-300" />
                </div>
              ) : subjectStats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BookOpen size={28} className="text-slate-300" />
                  <p className="text-xs font-semibold">Sem disciplinas ainda</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectStats.map(s => ({ name: s.name, Media: s.average, color: s.colorHex }))}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 20]} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="Media" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {subjectStats.map((s, i) => (
                        <Cell key={`cell-${i}`} fill={s.colorHex} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gráfico: Conteúdos por mês */}
          {!isLoading && contentsByMonth.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 flex items-center">
                  <FileText size={16} className="text-violet-500 mr-2" /> Conteúdos Registados por Mês
                </h3>
                <p className="text-xs text-slate-400">Evolução da frequência de registo de aulas</p>
              </div>
              <div className="h-48 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentsByMonth} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="total" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Estatísticas por disciplina (tabela) */}
          {!isLoading && subjectStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
                  <BookOpen size={16} className="text-slate-500 mr-2" /> Estatísticas Detalhadas por Disciplina
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Via VIEW subject_stats — dados calculados pelo Supabase</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Disciplina', 'Média', 'Rendimento', 'Conteúdos', 'Avaliações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {subjectStats.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.colorHex }} />
                            <span className="font-bold text-slate-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-display font-black ${s.average >= 16 ? 'text-emerald-600' : s.average >= 14 ? 'text-blue-600' : 'text-amber-600'}`}>
                            {s.average > 0 ? s.average : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${s.performance}%` }} />
                            </div>
                            <span className="font-bold text-slate-600">{s.performance > 0 ? `${s.performance}%` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{s.contentsCount}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{s.evaluationsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-4 space-y-6">

          {/* Destaques académicos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
              <Award size={16} className="text-amber-500 mr-2 fill-amber-500" />
              Destaques Académicos
            </h3>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : subjectStats.filter(s => s.average >= 16).length === 0 ? (
              <p className="text-xs text-slate-400 italic">Continue a esforçar-te para atingir médias acima de 16.</p>
            ) : (
              <div className="space-y-2.5">
                {subjectStats.filter(s => s.average >= 16).map(s => (
                  <div key={s.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{s.name}</span>
                    <span className="font-display font-black text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                      Média {s.average}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Oportunidades de foco */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
              <AlertTriangle size={16} className="text-rose-500 mr-2" />
              Oportunidades de Foco
            </h3>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-10" /></div>
            ) : subjectStats.filter(s => s.average > 0 && s.average < 14).length === 0 ? (
              <p className="text-xs text-emerald-600 font-bold">
                {subjectStats.length === 0
                  ? 'Sem disciplinas com avaliações ainda.'
                  : 'Excelente! Todas as tuas médias estão consolidadas!'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {subjectStats.filter(s => s.average > 0 && s.average < 14).map(s => (
                  <div key={s.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{s.name}</span>
                    <span className="font-display font-black text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200">
                      Média {s.average}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metas — resumo */}
          {!isLoading && goalStats.total > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
                <Target size={16} className="text-blue-500 mr-2" />
                Progresso das Metas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Taxa de conclusão</span>
                  <span className="font-black text-emerald-600">{goalStats.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${goalStats.completionRate}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Total', value: goalStats.total, color: 'text-slate-700' },
                    { label: 'Activas', value: goalStats.active, color: 'text-blue-600' },
                    { label: 'Concluídas', value: goalStats.completed, color: 'text-emerald-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400">{label}</p>
                      <p className={`font-display font-black text-base ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {goalStats.active > 0 && (
                  <div className="text-xs text-slate-500 font-semibold">
                    Progresso médio das activas: <span className="font-black text-blue-600">{goalStats.avgProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conteúdos por disciplina */}
          {!isLoading && contentsBySubject.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
                <FileText size={16} className="text-violet-500 mr-2" />
                Conteúdos por Disciplina
              </h3>
              <div className="space-y-2.5">
                {contentsBySubject.slice(0, 6).map(item => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-slate-500">{item.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: item.color,
                          width: `${(item.total / Math.max(...contentsBySubject.map(c => c.total))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights inteligentes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center">
              <Sparkles size={16} className="text-violet-500 mr-2 fill-violet-200" />
              Insights Automáticos
            </h3>
            <p className="text-[10px] text-slate-400">Gerados com base nos teus dados reais — sem inteligência artificial</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <div key={i} className={`p-3 border rounded-xl flex items-start space-x-2 ${INSIGHT_STYLES[ins.type]}`}>
                    {INSIGHT_ICONS[ins.type]}
                    <div>
                      <p className="text-[11px] font-bold leading-normal">{ins.title}</p>
                      <p className="text-[10px] mt-0.5 leading-relaxed opacity-90">{ins.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
