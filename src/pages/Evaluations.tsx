/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Evaluations.tsx — Módulo de Avaliações (dados reais via Supabase)
 *
 * CRUD completo: criar, editar, eliminar avaliações.
 * Filtros por disciplina, tipo e pesquisa textual.
 * Ordenação por data (mais recente primeiro).
 * Médias calculadas pela VIEW subject_stats do Supabase — nunca no frontend.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { CreateEvaluationPayload, UpdateEvaluationPayload } from '../services/evaluationsService';
import {
  ClipboardCheck, BookmarkPlus, AlertCircle, TrendingUp,
  Trash2, Pencil, X, Loader2, AlertTriangle, CheckCircle2,
  Search, ListFilter, RefreshCw, BookMarked, Calendar,
} from 'lucide-react';

const EVAL_TYPES = ['Prova', 'Trabalho', 'Exercício', 'Teste Surpresa', 'Participação'] as const;
type EvalType = typeof EVAL_TYPES[number];

// ─── Tipo de badge por tipo de avaliação ─────────────────────────────────────
const TYPE_COLORS: Record<EvalType, string> = {
  'Prova':          'bg-blue-100 text-blue-700',
  'Trabalho':       'bg-violet-100 text-violet-700',
  'Exercício':      'bg-amber-100 text-amber-700',
  'Teste Surpresa': 'bg-rose-100 text-rose-700',
  'Participação':   'bg-emerald-100 text-emerald-700',
};

export const Evaluations: React.FC = () => {
  const {
    subjects,
    evaluations, evaluationsLoading, evaluationsError,
    addEvaluation, editEvaluation, removeEvaluation,
    refreshEvaluations,
  } = useApp();

  // ── Estado do formulário ───────────────────────────────────────────────────
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [subjectId, setSubjectId]         = useState('');
  const [evalType, setEvalType]           = useState<EvalType>('Prova');
  const [evalDate, setEvalDate]           = useState(new Date().toISOString().split('T')[0]);
  const [maxValue, setMaxValue]           = useState<number>(20);
  const [gradeObtained, setGradeObtained] = useState('');
  const [notes, setNotes]                 = useState('');
  const [formError, setFormError]         = useState<string | null>(null);
  const [formSuccess, setFormSuccess]     = useState<string | null>(null);
  const [formLoading, setFormLoading]     = useState(false);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  const [filterType, setFilterType]           = useState('all');

  // ── Modal de eliminação ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]   = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // Inicializar subjectId com a primeira disciplina disponível
  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  // ── Resetar formulário ─────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setSubjectId(subjects[0]?.id ?? '');
    setEvalType('Prova');
    setEvalDate(new Date().toISOString().split('T')[0]);
    setMaxValue(20);
    setGradeObtained('');
    setNotes('');
    setFormError(null);
    setFormSuccess(null);
  };

  // ── Abrir edição ───────────────────────────────────────────────────────────
  const startEdit = (ev: typeof evaluations[0]) => {
    setEditingId(ev.id);
    setSubjectId(ev.subjectId);
    setEvalType(ev.type);
    setEvalDate(ev.date);
    setMaxValue(ev.maxValue);
    setGradeObtained(String(ev.gradeObtained));
    setNotes(ev.notes ?? '');
    setFormError(null);
    setFormSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submeter formulário ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validações no frontend (duplicadas no service para segurança)
    const grade = parseFloat(gradeObtained);
    if (!subjectId)        { setFormError('Selecciona uma disciplina.'); return; }
    if (isNaN(grade))      { setFormError('Introduz uma nota válida.'); return; }
    if (grade < 0)         { setFormError('A nota não pode ser negativa.'); return; }
    if (maxValue <= 0)     { setFormError('O valor máximo deve ser maior que zero.'); return; }
    if (grade > maxValue)  { setFormError(`A nota (${grade}) não pode exceder o máximo (${maxValue}).`); return; }

    setFormLoading(true);
    try {
      if (editingId) {
        const payload: UpdateEvaluationPayload = {
          subjectId,
          evalType,
          evalDate,
          maxValue,
          gradeObtained: grade,
          notes: notes || undefined,
        };
        await editEvaluation(editingId, payload);
        setFormSuccess('Avaliação actualizada com sucesso!');
      } else {
        const payload: CreateEvaluationPayload = {
          subjectId,
          evalType,
          evalDate,
          maxValue,
          gradeObtained: grade,
          notes: notes || undefined,
        };
        await addEvaluation(payload);
        const sub = subjects.find(s => s.id === subjectId);
        setFormSuccess(`Nota de ${sub?.name ?? 'disciplina'} guardada!`);
      }
      setTimeout(resetForm, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao guardar. Tenta novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Eliminar avaliação ─────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeEvaluation(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filtered = evaluations.filter(ev => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      ev.subjectName.toLowerCase().includes(q) ||
      ev.type.toLowerCase().includes(q) ||
      (ev.notes ?? '').toLowerCase().includes(q);
    const matchSubject = filterSubjectId === 'all' || ev.subjectId === filterSubjectId;
    const matchType    = filterType === 'all' || ev.type === filterType;
    return matchSearch && matchSubject && matchType;
  });

  // ── Estatísticas do topo ───────────────────────────────────────────────────
  const totalEvals  = evaluations.length;
  const passedEvals = evaluations.filter(e => (e.gradeObtained / e.maxValue) >= 0.5).length;
  const passRate    = totalEvals > 0 ? Math.round((passedEvals / totalEvals) * 100) : 0;
  const overallAvg  = totalEvals > 0
    ? (evaluations.reduce((sum, e) => sum + (e.gradeObtained / e.maxValue) * 20, 0) / totalEvals).toFixed(1)
    : '—';

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {editingId ? '✏️ Editar Avaliação' : 'Historial de Avaliações'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Regista notas de testes e exames. As médias por disciplina são recalculadas automaticamente.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={13} /><span>Cancelar Edição</span>
            </button>
          )}
          <div className="flex text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm select-none space-x-4">
            <div className="px-3 border-r border-slate-200">
              <p className="font-bold text-slate-400 uppercase text-[10px]">Total</p>
              <p className="font-display font-black text-slate-800 text-sm mt-0.5">
                {evaluationsLoading ? '…' : totalEvals}
              </p>
            </div>
            <div className="px-3 border-r border-slate-200">
              <p className="font-bold text-slate-400 uppercase text-[10px]">Média Geral</p>
              <p className="font-display font-black text-blue-600 text-sm mt-0.5">
                {evaluationsLoading ? '…' : overallAvg}
              </p>
            </div>
            <div className="px-3">
              <p className="font-bold text-slate-400 uppercase text-[10px]">Taxa Sucesso</p>
              <p className="font-display font-black text-emerald-600 text-sm mt-0.5">
                {evaluationsLoading ? '…' : `${passRate}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Erro global */}
      {evaluationsError && !evaluationsLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm font-semibold text-rose-700">{evaluationsError}</p>
          </div>
          <button onClick={refreshEvaluations} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer">
            <RefreshCw size={12} /><span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Formulário */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center">
            <BookmarkPlus size={18} className="text-blue-600 mr-2" />
            {editingId ? 'Editar Avaliação' : 'Nova Avaliação Escolar'}
          </h3>

          {/* Mensagens */}
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

            {/* Disciplina + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Disciplina
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  disabled={formLoading || subjects.length === 0}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                >
                  {subjects.length === 0
                    ? <option>A carregar…</option>
                    : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tipo de Avaliação
                </label>
                <select
                  value={evalType}
                  onChange={e => setEvalType(e.target.value as EvalType)}
                  disabled={formLoading}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                >
                  {EVAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Data + Escala */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data Realizada
                </label>
                <input
                  type="date"
                  required
                  value={evalDate}
                  onChange={e => setEvalDate(e.target.value)}
                  disabled={formLoading}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Escala Máx.
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={maxValue}
                  onChange={e => setMaxValue(parseFloat(e.target.value) || 20)}
                  disabled={formLoading}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
                />
              </div>
            </div>

            {/* Nota obtida */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nota Obtida (0 a {maxValue})
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={maxValue}
                required
                value={gradeObtained}
                onChange={e => setGradeObtained(e.target.value)}
                placeholder={`ex. ${(maxValue * 0.8).toFixed(1)}`}
                disabled={formLoading}
                className="block w-full text-xs font-bold py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
              />
              {/* Barra de pré-visualização da nota */}
              {gradeObtained && !isNaN(parseFloat(gradeObtained)) && (
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        parseFloat(gradeObtained) / maxValue >= 0.9 ? 'bg-emerald-500' :
                        parseFloat(gradeObtained) / maxValue >= 0.5 ? 'bg-blue-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (parseFloat(gradeObtained) / maxValue) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    {Math.round((parseFloat(gradeObtained) / maxValue) * 100)}% do máximo
                  </p>
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anotações (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ex. Matéria incluída, pontos a rever…"
                disabled={formLoading}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading || !gradeObtained}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs disabled:cursor-not-allowed"
            >
              {formLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
              ) : (
                <><ClipboardCheck size={14} /><span>{editingId ? 'Guardar Alterações' : 'Guardar Avaliação'}</span></>
              )}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-7 space-y-4">

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs grid sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar avaliações…"
                className="block w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="sm:col-span-4 flex items-center space-x-1.5">
              <ListFilter size={14} className="text-slate-400 shrink-0" />
              <select
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
                className="block w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              >
                <option value="all">Todas as Disciplinas</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="block w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              >
                <option value="all">Todos os Tipos</option>
                {EVAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Loading skeletons */}
          {evaluationsLoading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex space-x-2">
                      <div className="h-4 w-20 bg-slate-200 rounded-full" />
                      <div className="h-4 w-16 bg-slate-100 rounded-full" />
                    </div>
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </div>
                  <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!evaluationsLoading && !evaluationsError && evaluations.length === 0 && (
            <div className="bg-white p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                <BookMarked size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Nenhuma avaliação ainda</p>
                <p className="text-xs text-slate-400 mt-1">Regista a tua primeira nota para começar a acompanhar o teu rendimento.</p>
              </div>
            </div>
          )}

          {/* Empty filtros */}
          {!evaluationsLoading && evaluations.length > 0 && filtered.length === 0 && (
            <div className="bg-white p-10 rounded-2xl border border-slate-150 text-center text-slate-400 space-y-2">
              <AlertCircle size={28} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm">Nenhum resultado</p>
              <p className="text-xs">Tenta outro termo ou remove os filtros.</p>
            </div>
          )}

          {/* Lista de avaliações */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {!evaluationsLoading && filtered.map(ev => {
              const sub      = subjects.find(s => s.id === ev.subjectId);
              const isPassed = (ev.gradeObtained / ev.maxValue) >= 0.5;
              const pct      = Math.round((ev.gradeObtained / ev.maxValue) * 100);
              const isEditing = editingId === ev.id;

              return (
                <div
                  key={ev.id}
                  className={`bg-white p-4 rounded-2xl border shadow-xs transition ${
                    isEditing
                      ? 'border-blue-300 ring-2 ring-blue-100'
                      : 'border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">

                    {/* Info esquerda */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white"
                          style={{ backgroundColor: sub?.colorHex ?? '#94a3b8' }}
                        >
                          {ev.subjectName}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${TYPE_COLORS[ev.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ev.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                          <Calendar size={10} className="mr-1" />{ev.date}
                        </span>
                      </div>
                      {ev.notes && (
                        <p className="text-[11px] text-slate-500 italic leading-normal">"{ev.notes}"</p>
                      )}
                      {/* Barra de aproveitamento */}
                      <div className="flex items-center space-x-2 pt-1">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPassed ? 'bg-blue-500' : 'bg-rose-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${isPassed ? 'text-blue-600' : 'text-rose-600'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Nota + Acções */}
                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nota</span>
                        <p className={`font-display text-xl font-black ${isPassed ? 'text-blue-600' : 'text-rose-600'}`}>
                          {ev.gradeObtained}
                          <span className="text-[10px] text-slate-400 font-bold"> / {ev.maxValue}</span>
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => startEdit(ev)}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: ev.id, label: `${ev.subjectName} — ${ev.type} (${ev.gradeObtained}/${ev.maxValue})` })}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal Confirmação de Eliminação ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={22} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Eliminar Avaliação</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tens a certeza que queres eliminar<br />
                <strong className="text-slate-800">"{deleteTarget.label}"</strong>?
              </p>
              <p className="text-xs text-amber-600 font-semibold mt-2">
                A média da disciplina será recalculada automaticamente.
              </p>
            </div>
            {deleteError && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl">{deleteError}</p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => { if (!deleteLoading) setDeleteTarget(null); }}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {deleteLoading
                  ? <><Loader2 size={14} className="animate-spin" /><span>A eliminar…</span></>
                  : <span>Sim, Eliminar</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
