/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  Plus,
  CheckCircle,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Info,
  BookmarkCheck,
  Award
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { goals, addGoal, toggleGoalCompletion } = useApp();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Estudo');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('média');
  const [dueDate, setDueDate] = useState('2026-06-30');

  // Filter tab
  const [filterTab, setFilterTab] = useState<'active' | 'completed'>('active');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !target) return;

    const numericTarget = parseFloat(target);
    if (isNaN(numericTarget) || numericTarget <= 0) return;

    addGoal({
      title,
      category,
      target: numericTarget,
      current: 0,
      unit,
      dueDate
    });

    // Reset
    setTitle('');
    setTarget('');
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const displayList = filterTab === 'active' ? activeGoals : completedGoals;

  // Calculate high stats
  const totalCounts = goals.length;
  const completedCount = completedGoals.length;
  const successPercentage = totalCounts > 0 ? Math.round((completedCount / totalCounts) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">As Minhas Metas Académicas</h1>
          <p className="text-sm text-slate-500 mt-1">Cria metas desafiantes de estudo e notas para monitorizar o teu progresso pessoal de forma gamificada.</p>
        </div>

        {/* Global progress */}
        <div className="bg-slate-55 bg-slate-50 p-3 h-14 rounded-xl border border-slate-100 flex items-center shadow-3xs select-none">
          <div className="px-3 border-r border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Metas Concluídas</p>
            <p className="font-display font-black text-slate-800 text-sm mt-0.5">{completedCount} / {totalCounts}</p>
          </div>
          <div className="px-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Sucesso</p>
            <p className="font-display font-black text-emerald-600 text-sm mt-0.5">{successPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Create academic goals Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-slate-850 text-sm sm:text-base flex items-center pr-2">
            <Target size={18} className="text-blue-600 mr-2" /> Nova Meta de Alto Rendimento
          </h3>

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nome / Título da Meta
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Chegar a média de 16 em Matemática"
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
                >
                  <option value="Notas">Notas (Médias)</option>
                  <option value="Estudo">Estudo (Fichas/Aulas)</option>
                  <option value="Atividades">Atividades (Exercícios)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unidade
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
                >
                  <option value="média">Média final</option>
                  <option value="vezes/semana">Vezes por semana</option>
                  <option value="resumos">Resumos de aula</option>
                  <option value="exercícios">Exercícios</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Valor Alvo (Meta)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="ex. 16 ou 100"
                  className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prazo de Entrega
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!title || !target}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs"
            >
              <Plus size={14} />
              <span>Inserir Nova Meta</span>
            </button>
          </form>
        </div>

        {/* Right Column: Interactive goal listings and toggling */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setFilterTab('active')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                filterTab === 'active'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-505 text-slate-500 hover:text-slate-850'
              }`}
            >
              <span>Metas Ativas ({activeGoals.length})</span>
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`pb-2.5 px-4 text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                filterTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-505 text-slate-500 hover:text-slate-850'
              }`}
            >
              <Award size={13} />
              <span>Concluídas ({completedGoals.length})</span>
            </button>
          </div>

          {/* list items */}
          <div className="space-y-3">
            {displayList.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 border border-slate-150 rounded-2xl">
                <Info className="mx-auto text-slate-350 mb-2" size={28} />
                <p className="font-semibold text-sm">
                  {filterTab === 'active' ? 'Nenhuma meta ativa de momento!' : 'Ainda não concluiu nenhuma meta.'}
                </p>
                <p className="text-xs">
                  {filterTab === 'active' ? 'Use o criador de metas à esquerda para estipular prioridades de estudo.' : 'Marque as metas ativas como concluídas para preencher a sua galeria de prémios!'}
                </p>
              </div>
            ) : (
              displayList.map((goal) => {
                const ratio = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                return (
                  <div
                    key={goal.id}
                    className="bg-white p-4.5 rounded-2xl border border-slate-155 shadow-3xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-extrabold tracking-wider bg-slate-100 text-slate-600 px-2.0 py-0.5 rounded-md uppercase">
                            {goal.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center">
                            <Calendar size={11} className="mr-1" /> Prazo: {goal.dueDate}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-850 text-sm sm:text-base">{goal.title}</h4>
                      </div>

                      {/* checkbox toggle trigger dynamically */}
                      <button
                        onClick={() => toggleGoalCompletion(goal.id)}
                        className={`p-1 px-2.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer shrink-0 ${
                          goal.isCompleted
                            ? 'bg-emerald-120 bg-emerald-50 text-emerald-800 border-emerald-250 border-emerald-100'
                            : 'bg-blue-50 text-blue-750 border-blue-150 border-blue-100 hover:bg-blue-100'
                        }`}
                      >
                        {goal.isCompleted ? '✓ Concluída' : 'Marcar Concluída'}
                      </button>
                    </div>

                    {/* Progress slider info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Progresso consolidado</span>
                        <span className="font-bold">
                          {goal.current} / {goal.target} {goal.unit} ({ratio}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            goal.isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${ratio}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
