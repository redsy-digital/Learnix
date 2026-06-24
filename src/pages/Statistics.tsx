/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  Sparkles,
  BarChart2,
  BookmarkCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const Statistics: React.FC = () => {
  const { subjects, contents, evaluations } = useApp();

  // Aggregate stats
  const totalContents = contents.length;
  const totalEvaluations = evaluations.length;
  const globalAverage = subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length;

  // Sorting to find strengths & weaknesses
  const sortedSubjects = [...subjects].sort((a, b) => b.average - a.average);
  const strongSubjects = sortedSubjects.filter((s) => s.average >= 16.0);
  const weakSubjects = sortedSubjects.filter((s) => s.average < 14.8);

  // Chart 1: Grade Evolution path (chronological mapping of some grades)
  // map to format suited for chart
  const historicalAverages = evaluations
    .slice(0, 10)
    .reverse()
    .map((e) => ({
      date: e.date.substring(5), // MM-DD
      Nota: e.gradeObtained,
      Materia: e.subjectName
    }));

  // Chart 2: Average by subject data format
  const comparisonData = subjects.map((s) => ({
    name: s.name,
    Media: s.average,
    color: s.colorHex
  }));

  const PerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs shadow-xl">
          <p className="font-extrabold">{item.Materia || item.name}</p>
          <p className="mt-1 font-semibold text-blue-400">Pontuação: {payload[0].value} / 20.0</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Análise de Desempenho e Estatísticas</h1>
        <p className="text-sm text-slate-500 mt-1">Navega pelos relatórios inteligentes de evolução e tendências gerados pelo Learnix.</p>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aulas Registradas</p>
          <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{totalContents} lições</h3>
          <p className="text-[10px] text-emerald-600 mt-2 font-bold">100% catalogado</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provas Efetuadas</p>
          <h3 className="font-display text-2xl font-black text-slate-800 mt-1">{totalEvaluations} avaliações</h3>
          <p className="text-[10px] text-blue-600 mt-2 font-bold">Trimestral em progresso</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Média Geral Global</p>
          <h3 className="font-display text-2xl font-black text-blue-600 mt-1">{globalAverage.toFixed(2)}</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-bold">Média ponderada do ano</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evolução de Notas</p>
          <h3 className="font-display text-2xl font-black text-emerald-600 mt-1">+4.2%</h3>
          <p className="text-[10px] text-emerald-600 mt-2 font-bold">Alta de aproveitamento</p>
        </div>
      </div>

      {/* Charts section split-grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left pane: Area chart of grade evolution & comparisons */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chronological Area Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 flex items-center">
                <TrendingUp size={16} className="text-emerald-500 mr-2" /> Cronologia de Resultados (Últimas 10 Notas)
              </h3>
              <p className="text-xs text-slate-400">Acompanha graficamente a pontuação obtida nos testes e trabalhos ao longo das datas.</p>
            </div>

            <div className="h-64 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalAverages} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMaxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
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
                  <Tooltip content={<PerformanceTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Nota"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMaxGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar comparison per subject averages */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-800 flex items-center">
                <BarChart2 size={16} className="text-blue-500 mr-2" /> Médias Comparativas por Disciplina
              </h3>
              <p className="text-xs text-slate-400">Verificação comparativa de cada nota final em relação à meta clássica de aprovação.</p>
            </div>

            <div className="h-64 pt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 20]}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<PerformanceTooltip />} />
                  <Bar dataKey="Media" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right pane: Strengths and Opportunities focus with advice */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Academic Strengths */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-850 text-sm flex items-center">
              <Award size={16} className="text-amber-500 mr-2 fill-amber-500" /> Destaques Académicos (Fortes)
            </h3>

            <div className="space-y-2.5">
              {strongSubjects.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Continue se esforçando para atingir médias acima de 16 valores.</p>
              ) : (
                strongSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{sub.name}</span>
                    <span className="font-display font-black text-indigo-750 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                      Média {sub.average}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Weaknesses / Opportunities */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-850 text-sm flex items-center">
              <AlertTriangle size={16} className="text-rose-500 mr-2" /> Oportunidades de Foco (Atenção)
            </h3>

            <div className="space-y-2.5">
              {weakSubjects.length === 0 ? (
                <p className="text-xs text-emerald-600 font-bold">Excelente! Todas as tuas médias estão consolidadas e elevadas!</p>
              ) : (
                weakSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs animate-pulse"
                  >
                    <span className="font-bold text-slate-800">{sub.name}</span>
                    <span className="font-display font-black text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-200">
                      Média {sub.average}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI study advisor card based on stats */}
          <div className="p-5 bg-gradient-to-tr from-blue-700 to-indigo-900 text-white rounded-2xl shadow-md border border-indigo-650 space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="fill-white text-white" />
              <span className="text-xs font-bold uppercase tracking-wider">Aconselhamento Learnix IA</span>
            </div>
            <p className="text-xs leading-relaxed text-blue-100">
              Detetamos que o teu aproveitamento em <span className="font-extrabold text-amber-300">História</span> está abaixo da tua meta. Recomendamos resolver um teste rápido de 5 minutos sobre este tópico hoje para consolidar o teu conhecimento trimestral antes do conselho de avaliações!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
