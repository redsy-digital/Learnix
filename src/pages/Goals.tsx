/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Goals.tsx — Módulo de Metas Académicas (dados reais via Supabase)
 *
 * CRUD completo: criar, editar, eliminar, concluir metas.
 * Progresso automático para metas de Notas (subject_stats), Estudo e Actividades.
 * Progresso manual para categorias não inferíveis.
 * Loading, empty state, error state.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { CreateGoalPayload, UpdateGoalPayload, GoalCategory } from '../services/goalsService';
import {
  Target, Plus, CheckCircle, TrendingUp, Calendar,
  Award, Info, Pencil, Trash2, X, Loader2,
  AlertTriangle, CheckCircle2, RefreshCw, BookMarked,
} from 'lucide-react';

const CATEGORIES: GoalCategory[] = ['Notas', 'Estudo', 'Actividades', 'Leitura', 'Outro'];

const CATEGORY_UNITS: Record<GoalCategory, string[]> = {
  Notas:       ['média', 'pontos'],
  Estudo:      ['conteúdos', 'resumos', 'fichas', 'aulas', 'horas'],
  Actividades: ['exercícios', 'avaliações', 'provas', 'testes'],
  Leitura:     ['páginas', 'capítulos', 'livros'],
  Outro:       ['pontos', 'vezes', 'dias', 'sessões'],
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  Notas:       'bg-blue-100 text-blue-700',
  Estudo:      'bg-violet-100 text-violet-700',
  Actividades: 'bg-amber-100 text-amber-700',
  Leitura:     'bg-emerald-100 text-emerald-700',
  Outro:       'bg-slate-100 text-slate-700',
};

export const Goals: React.FC = () => {
  const {
    goals, goalsLoading, goalsError,
    addGoal, editGoal, removeGoal,
    toggleGoalCompletion, setGoalProgress,
    syncGoalProgress, refreshGoals,
    subjects, contents, evaluations,
  } = useApp();

  // ── Sincronização automática de progresso ao montar ───────────────────────
  useEffect(() => {
    if (!goalsLoading && goals.length > 0 && subjects.length > 0) {
      const subjectAverages: Record<string, number> = {};
      subjects.forEach(s => { subjectAverages[s.name] = s.average; });
      syncGoalProgress({
        subjectAverages,
        totalContents:    contents.length,
        totalEvaluations: evaluations.length,
      }).catch(() => {});
    }
  }, [goalsLoading, subjects.length, contents.length, evaluations.length]);

  // ── Estado do formulário ───────────────────────────────────────────────────
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [formOpen, setFormOpen]       = useState(false);
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState<GoalCategory>('Notas');
  const [target, setTarget]           = useState('');
  const [unit, setUnit]               = useState('média');
  const [dueDate, setDueDate]         = useState('');
  const [formError, setFormError]     = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ── Progresso manual ───────────────────────────────────────────────────────
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [progressInput, setProgressInput]         = useState('');
  const [progressLoading, setProgressLoading]     = useState(false);

  // ── Modal de eliminação ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]   = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filterTab, setFilterTab] = useState<'active' | 'completed'>('active');

  // Actualizar unidade quando a categoria muda
  useEffect(() => {
    setUnit(CATEGORY_UNITS[category]?.[0] ?? 'pontos');
  }, [category]);

  // ── Resetar formulário ─────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Notas');
    setTarget('');
    setUnit('média');
    setDueDate('');
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(false);
  };

  // ── Abrir edição ───────────────────────────────────────────────────────────
  const startEdit = (goal: typeof goals[0]) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setCategory(goal.category as GoalCategory);
    setTarget(String(goal.target));
    setUnit(goal.unit);
    setDueDate(goal.dueDate ?? '');
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submeter formulário ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numTarget = parseFloat(target);
    if (!title.trim())            { setFormError('O título é obrigatório.'); return; }
    if (isNaN(numTarget) || numTarget <= 0) { setFormError('O valor alvo deve ser maior que zero.'); return; }

    setFormLoading(true);
    try {
      if (editingId) {
        const payload: UpdateGoalPayload = {
          title, category, target: numTarget, unit,
          dueDate: dueDate || undefined,
        };
        await editGoal(editingId, payload);
        setFormSuccess('Meta actualizada com sucesso!');
      } else {
        const payload: CreateGoalPayload = {
          title, category, target: numTarget, unit,
          dueDate: dueDate || undefined,
        };
        await addGoal(payload);
        setFormSuccess('Meta criada com sucesso!');
      }
      setTimeout(resetForm, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao guardar.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Guardar progresso manual ───────────────────────────────────────────────
  const handleProgressSave = async (goalId: string) => {
    const val = parseFloat(progressInput);
    if (isNaN(val) || val < 0) return;
    setProgressLoading(true);
    try {
      await setGoalProgress(goalId, val);
      setEditingProgressId(null);
    } catch {
      // Silencioso — UI mantém valor anterior
    } finally {
      setProgressLoading(false);
    }
  };

  // ── Eliminar meta ──────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeGoal(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Listas filtradas ───────────────────────────────────────────────────────
  const activeGoals    = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);
  const displayList    = filterTab === 'active' ? activeGoals : completedGoals;

  const totalCount     = goals.length;
  const completedCount = completedGoals.length;
  const successPct     = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const avgProgress    = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + Math.min((g.current / g.target) * 100, 100), 0) / activeGoals.length)
    : 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {editingId ? '✏️ Editar Meta' : 'As Minhas Metas Académicas'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cria metas desafiantes e acompanha o progresso com dados reais do sistema.</p>
        </div>
        <div className="flex items-center space-x-3">
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 flex items-center space-x-1 cursor-pointer">
              <X size={13} /><span>Cancelar</span>
            </button>
          )}
          {!goalsLoading && (
            <div className="bg-slate-50 p-3 h-14 rounded-xl border border-slate-100 flex items-center shadow-xs select-none">
              <div className="px-3 border-r border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Concluídas</p>
                <p className="font-display font-black text-slate-800 text-sm mt-0.5">{completedCount} / {totalCount}</p>
              </div>
              <div className="px-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Sucesso</p>
                <p className="font-display font-black text-emerald-600 text-sm mt-0.5">{successPct}%</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { if (formOpen && !editingId) resetForm(); else setFormOpen(true); }}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            {formOpen && !editingId ? <X size={14} /> : <Plus size={14} />}
            <span>{formOpen && !editingId ? 'Fechar' : 'Nova Meta'}</span>
          </button>
        </div>
      </div>

      {/* Erro global */}
      {goalsError && !goalsLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm font-semibold text-rose-700">{goalsError}</p>
          </div>
          <button onClick={refreshGoals} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer">
            <RefreshCw size={12} /><span>Tentar novamente</span>
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Formulário */}
        {(formOpen || editingId) && (
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-blue-200/60 shadow-md space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
              <Target size={18} className="text-blue-600 mr-2" />
              {editingId ? 'Editar Meta' : 'Nova Meta de Alto Rendimento'}
            </h3>

            {formError && (
              <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-700">{formError}</p>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-emerald-700">{formSuccess}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome / Título da Meta</label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="ex. Chegar a média de 16 em Matemática"
                  disabled={formLoading}
                  className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoria</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value as GoalCategory)}
                    disabled={formLoading}
                    className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unidade</label>
                  <select
                    value={unit} onChange={e => setUnit(e.target.value)}
                    disabled={formLoading}
                    className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                  >
                    {(CATEGORY_UNITS[category] ?? ['pontos']).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Alvo</label>
                  <input
                    type="number" step="0.1" min="0.1" required value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="ex. 16 ou 50" disabled={formLoading}
                    className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prazo (Opcional)</label>
                  <input
                    type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    disabled={formLoading}
                    className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none transition disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Dica de progresso automático */}
              {(category === 'Notas' || category === 'Estudo' || category === 'Actividades') && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start space-x-2">
                  <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    {category === 'Notas' && 'O progresso será calculado automaticamente a partir das médias reais das disciplinas.'}
                    {category === 'Estudo' && 'O progresso será calculado a partir dos conteúdos registados (se a unidade for conteúdos, resumos ou fichas).'}
                    {category === 'Actividades' && 'O progresso será calculado a partir das avaliações registadas (se a unidade for exercícios ou avaliações).'}
                  </p>
                </div>
              )}

              <button
                type="submit" disabled={formLoading || !title || !target}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs disabled:cursor-not-allowed"
              >
                {formLoading
                  ? <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
                  : <><Plus size={14} /><span>{editingId ? 'Guardar Alterações' : 'Criar Meta'}</span></>
                }
              </button>
            </form>
          </div>
        )}

        {/* Lista de metas */}
        <div className={`${(formOpen || editingId) ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {(['active', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`pb-2.5 px-4 text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
                  filterTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'active' ? (
                  <span>Metas Activas ({goalsLoading ? '…' : activeGoals.length})</span>
                ) : (
                  <><Award size={13} /><span>Concluídas ({goalsLoading ? '…' : completedGoals.length})</span></>
                )}
              </button>
            ))}
          </div>

          {/* Loading skeletons */}
          {goalsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 bg-slate-200 rounded-full" />
                      <div className="h-4 w-48 bg-slate-300 rounded" />
                    </div>
                    <div className="h-8 w-28 bg-slate-200 rounded-xl" />
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!goalsLoading && !goalsError && goals.length === 0 && (
            <div className="bg-white p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                <BookMarked size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Nenhuma meta ainda</p>
                <p className="text-xs text-slate-400 mt-1">Cria a tua primeira meta para acompanhar o teu progresso académico.</p>
              </div>
              {!formOpen && (
                <button onClick={() => setFormOpen(true)} className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer">
                  <Plus size={14} /><span>Criar Primeira Meta</span>
                </button>
              )}
            </div>
          )}

          {/* Empty da tab */}
          {!goalsLoading && goals.length > 0 && displayList.length === 0 && (
            <div className="bg-white p-12 text-center text-slate-400 border border-slate-150 rounded-2xl">
              <Info className="mx-auto text-slate-300 mb-2" size={28} />
              <p className="font-semibold text-sm">
                {filterTab === 'active' ? 'Nenhuma meta activa!' : 'Ainda não concluíste nenhuma meta.'}
              </p>
            </div>
          )}

          {/* Lista */}
          <div className="space-y-3">
            {!goalsLoading && displayList.map(goal => {
              const ratio      = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              const isEditing  = editingId === goal.id;
              const isManual   = ['Leitura', 'Outro'].includes(goal.category) ||
                                 (!['Notas', 'Estudo', 'Actividades'].includes(goal.category));
              const isEditingProgress = editingProgressId === goal.id;

              return (
                <div
                  key={goal.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 transition ${
                    isEditing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${CATEGORY_COLORS[goal.category as GoalCategory] ?? 'bg-slate-100 text-slate-600'}`}>
                          {goal.category}
                        </span>
                        {goal.dueDate && (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center">
                            <Calendar size={10} className="mr-1" />Prazo: {goal.dueDate}
                          </span>
                        )}
                        {!isManual && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Auto
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{goal.title}</h4>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {!goal.isCompleted && (
                        <button onClick={() => startEdit(goal)} title="Editar" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget({ id: goal.id, title: goal.title })} title="Eliminar" className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => toggleGoalCompletion(goal.id, goal.isCompleted)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition cursor-pointer ${
                          goal.isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                        }`}
                      >
                        {goal.isCompleted ? '✓ Concluída' : 'Marcar Concluída'}
                      </button>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Progresso consolidado</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">
                          {goal.current} / {goal.target} {goal.unit} ({ratio}%)
                        </span>
                        {/* Editar progresso manual */}
                        {!goal.isCompleted && (isManual || true) && !isEditingProgress && (
                          <button
                            onClick={() => { setEditingProgressId(goal.id); setProgressInput(String(goal.current)); }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditingProgress ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number" step="0.1" min="0" max={goal.target}
                          value={progressInput}
                          onChange={e => setProgressInput(e.target.value)}
                          className="text-xs font-bold py-1.5 px-3 bg-slate-50 border border-blue-300 rounded-lg outline-none focus:border-blue-500 w-24"
                          autoFocus
                        />
                        <span className="text-xs text-slate-400">/ {goal.target} {goal.unit}</span>
                        <button
                          onClick={() => handleProgressSave(goal.id)}
                          disabled={progressLoading}
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-60"
                        >
                          {progressLoading ? <Loader2 size={11} className="animate-spin" /> : '✓'}
                        </button>
                        <button
                          onClick={() => setEditingProgressId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            goal.isCompleted ? 'bg-emerald-500' :
                            ratio >= 90 ? 'bg-emerald-500' :
                            ratio >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de eliminação */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={22} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Eliminar Meta</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tens a certeza que queres eliminar <strong className="text-slate-800">"{deleteTarget.title}"</strong>?
              </p>
            </div>
            {deleteError && <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl">{deleteError}</p>}
            <div className="flex space-x-3">
              <button onClick={() => { if (!deleteLoading) setDeleteTarget(null); }} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer disabled:opacity-60">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2">
                {deleteLoading ? <><Loader2 size={14} className="animate-spin" /><span>A eliminar…</span></> : <span>Sim, Eliminar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
