/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Subjects.tsx — Módulo de Disciplinas (dados reais via Supabase)
 *
 * CRUD completo: criar, editar, eliminar disciplinas.
 * Loading, empty state, error state com design consistente.
 * Modal de confirmação antes de eliminar.
 * Aviso de dependências (conteúdos, avaliações, horários associados).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Subject, CreateSubjectPayload, UpdateSubjectPayload } from '../types';
import type { SubjectDependencies } from '../hooks/useSubjects';
import {
  BookOpen, TrendingUp, FileText, ClipboardCheck,
  ChevronRight, Info, Clock, Plus, Pencil, Trash2,
  X, Loader2, AlertTriangle, CheckCircle2, BookMarked,
  RefreshCw,
} from 'lucide-react';

// ─── Paleta de cores disponíveis para disciplinas ─────────────────────────────

const COLOR_OPTIONS = [
  { label: 'Azul',     color: 'blue',    hex: '#2563EB' },
  { label: 'Índigo',   color: 'indigo',  hex: '#4F46E5' },
  { label: 'Violeta',  color: 'violet',  hex: '#7C3AED' },
  { label: 'Roxo',     color: 'purple',  hex: '#9333EA' },
  { label: 'Rosa',     color: 'pink',    hex: '#EC4899' },
  { label: 'Vermelho', color: 'rose',    hex: '#F43F5E' },
  { label: 'Laranja',  color: 'orange',  hex: '#F97316' },
  { label: 'Âmbar',    color: 'amber',   hex: '#F59E0B' },
  { label: 'Lima',     color: 'lime',    hex: '#84CC16' },
  { label: 'Verde',    color: 'emerald', hex: '#10B981' },
  { label: 'Teal',     color: 'teal',    hex: '#14B8A6' },
  { label: 'Ciano',    color: 'sky',     hex: '#0EA5E9' },
  { label: 'Cinzento', color: 'slate',   hex: '#64748B' },
];

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit';

interface SubjectFormState {
  name: string;
  color: string;
  color_hex: string;
}

interface DeleteConfirmState {
  subject: Subject;
  deps: SubjectDependencies | null;
  isLoadingDeps: boolean;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const Subjects: React.FC = () => {
  const {
    subjects, subjectsLoading, subjectsError,
    addSubject, editSubject, removeSubject,
    getDependencies, refreshSubjects,
    contents, evaluations,
  } = useApp();

  // ── Estado da lista ────────────────────────────────────────────────────────
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Seleccionar automaticamente a primeira disciplina quando a lista carrega
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
    // Limpar selecção se a disciplina seleccionada foi apagada
    if (selectedSubjectId && !subjects.find(s => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0]?.id ?? null);
    }
  }, [subjects]);

  // ── Estado do modal de criação/edição ──────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState<ModalMode>('create');
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [formState, setFormState]   = useState<SubjectFormState>({
    name: '', color: 'blue', color_hex: '#2563EB',
  });
  const [formError, setFormError]   = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── Estado do modal de confirmação de eliminação ───────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ── Dados do painel de detalhe ─────────────────────────────────────────────
  const selectedSubject     = subjects.find(s => s.id === selectedSubjectId) ?? null;
  const subjectContents     = contents.filter(c => c.subjectId === selectedSubjectId);
  const subjectEvaluations  = evaluations.filter(e => e.subjectId === selectedSubjectId);

  // ── Abrir modal de criação ─────────────────────────────────────────────────
  const openCreateModal = () => {
    setFormState({ name: '', color: 'blue', color_hex: '#2563EB' });
    setFormError(null);
    setFormSuccess(null);
    setEditingId(null);
    setModalMode('create');
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  // ── Abrir modal de edição ──────────────────────────────────────────────────
  const openEditModal = (sub: Subject) => {
    setFormState({ name: sub.name, color: sub.color, color_hex: sub.colorHex });
    setFormError(null);
    setFormSuccess(null);
    setEditingId(sub.id);
    setModalMode('edit');
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  const closeModal = () => {
    if (formLoading) return;
    setModalOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  // ── Submeter formulário (criar ou editar) ──────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const name = formState.name.trim();
    if (!name) { setFormError('O nome da disciplina é obrigatório.'); return; }
    if (name.length > 60) { setFormError('O nome não pode ter mais de 60 caracteres.'); return; }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        const payload: CreateSubjectPayload = {
          name,
          color:     formState.color,
          color_hex: formState.color_hex,
        };
        const created = await addSubject(payload);
        setFormSuccess(`"${created.name}" criada com sucesso!`);
        setSelectedSubjectId(created.id);
        setTimeout(closeModal, 1200);
      } else if (editingId) {
        const payload: UpdateSubjectPayload = {
          name,
          color:     formState.color,
          color_hex: formState.color_hex,
        };
        const updated = await editSubject(editingId, payload);
        setFormSuccess(`"${updated.name}" actualizada!`);
        setTimeout(closeModal, 1000);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro inesperado. Tenta novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Iniciar fluxo de eliminação ────────────────────────────────────────────
  const startDelete = async (sub: Subject) => {
    setDeleteError(null);
    setDeleteConfirm({ subject: sub, deps: null, isLoadingDeps: true });
    try {
      const deps = await getDependencies(sub.id);
      setDeleteConfirm(prev => prev ? { ...prev, deps, isLoadingDeps: false } : null);
    } catch {
      setDeleteConfirm(prev => prev ? { ...prev, isLoadingDeps: false } : null);
    }
  };

  // ── Confirmar eliminação ───────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeSubject(deleteConfirm.subject.id);
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao eliminar. Tenta novamente.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Cor seleccionada no formulário ─────────────────────────────────────────
  const selectColor = (hex: string, color: string) => {
    setFormState(prev => ({ ...prev, color_hex: hex, color }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            As Minhas Disciplinas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gere as tuas disciplinas, acompanha médias e rendimento académico.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {!subjectsLoading && (
            <div className="bg-blue-50 text-blue-700 font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-1">
              <BookOpen size={14} />
              <span>{subjects.length} Disciplinas</span>
            </div>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-blue-100 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {/* Erro global de carregamento */}
      {subjectsError && !subjectsLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-700">{subjectsError}</p>
          </div>
          <button
            onClick={refreshSubjects}
            className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Painel esquerdo — lista de disciplinas */}
        <div className="lg:col-span-5 space-y-3">

          {/* Loading state */}
          {subjectsLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 w-8 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!subjectsLoading && !subjectsError && subjects.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                <BookMarked size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Nenhuma disciplina ainda</p>
                <p className="text-xs text-slate-400 mt-1">Cria a tua primeira disciplina para começar a acompanhar o teu percurso académico.</p>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Criar Primeira Disciplina</span>
              </button>
            </div>
          )}

          {/* Lista de disciplinas */}
          {!subjectsLoading && subjects.map(sub => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <div key={sub.id} className="group relative">
                <button
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 scale-[1.01]'
                      : 'bg-white border-slate-150 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ${isSelected ? 'bg-white/15' : ''}`}
                      style={!isSelected ? { backgroundColor: sub.colorHex } : undefined}
                    >
                      {sub.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">{sub.name}</h4>
                      <p className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {sub.contentsCount} conteúdos • {sub.evaluationsCount} avaliações
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-75">Média</p>
                      <p className="text-base font-black font-mono mt-0.5">
                        {sub.average > 0 ? sub.average : '—'}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`transform transition group-hover:translate-x-0.5 ${isSelected ? 'text-white' : 'text-slate-300'}`}
                    />
                  </div>
                </button>

                {/* Botões de acção (visíveis no hover) */}
                <div className={`absolute right-12 top-1/2 -translate-y-1/2 flex items-center space-x-1 transition-all ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(sub); }}
                    className={`p-1.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                    }`}
                    title="Editar disciplina"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); startDelete(sub); }}
                    className={`p-1.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                    }`}
                    title="Eliminar disciplina"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel direito — detalhe da disciplina */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden sticky top-20">
          {subjectsLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={32} className="text-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-400">A carregar disciplinas…</p>
            </div>
          ) : selectedSubject ? (
            <div className="divide-y divide-slate-100">

              {/* Cabeçalho do detalhe */}
              <div className="p-6 bg-slate-50/75 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3.5">
                  <div
                    className="w-12 h-12 rounded-xl text-white font-black text-lg flex items-center justify-center shadow"
                    style={{ backgroundColor: selectedSubject.colorHex }}
                  >
                    {selectedSubject.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">{selectedSubject.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                      <Clock size={12} className="mr-1 inline" />
                      Última actividade: {selectedSubject.lastActivity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(selectedSubject)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => startDelete(selectedSubject)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 bg-white border border-rose-100 px-3 py-1.5 rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>

                  <div className="flex space-x-3 ml-2">
                    <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-150 shadow-xs text-center min-w-[70px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Média</p>
                      <p className="font-display text-lg font-black text-slate-800">
                        {selectedSubject.average > 0 ? selectedSubject.average : '—'}
                      </p>
                    </div>
                    <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-150 shadow-xs text-center min-w-[70px]">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Rendimento</p>
                      <p className="font-display text-lg font-black text-emerald-600">
                        {selectedSubject.performance > 0 ? `${selectedSubject.performance}%` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Progresso do Currículo</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-650">
                    <span>Retenção de Conteúdo Estimada</span>
                    <span className="font-bold">{selectedSubject.performance}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: selectedSubject.colorHex, width: `${selectedSubject.performance}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Conteúdos */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <FileText size={14} className="mr-1.5" />
                  Conteúdos de Aula ({subjectContents.length})
                </h4>
                {subjectContents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhum conteúdo registado para esta disciplina.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {subjectContents.map(content => (
                      <div key={content.id} className="p-3 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-xl transition space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>{content.date}</span>
                          {content.isPhotoUpload && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full">FOTO</span>
                          )}
                        </div>
                        <h5 className="font-bold text-slate-800">{content.title}</h5>
                        <p className="text-slate-500 leading-normal line-clamp-2">{content.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Avaliações */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <ClipboardCheck size={14} className="mr-1.5" />
                  Histórico de Notas ({subjectEvaluations.length})
                </h4>
                {subjectEvaluations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhuma avaliação registada nesta disciplina.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {subjectEvaluations.map(evalItem => (
                      <div key={evalItem.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-lg text-slate-500 uppercase">{evalItem.type}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{evalItem.date}</span>
                        </div>
                        <div className="mt-3 flex justify-between items-end">
                          <p className="text-xs text-slate-500 font-medium">Nota Obtida</p>
                          <p className="font-display font-black text-slate-800 text-sm">
                            {evalItem.gradeObtained} <span className="text-[10px] text-slate-400 font-bold">/ {evalItem.maxValue}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Info size={36} className="mx-auto" />
              <p className="font-bold">Nenhuma disciplina seleccionada</p>
              <p className="text-xs max-w-xs mx-auto">
                Selecciona uma disciplina no painel lateral para ver as avaliações, resumos e desempenho.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Criar / Editar ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header do modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">
                {modalMode === 'create' ? 'Nova Disciplina' : 'Editar Disciplina'}
              </h2>
              <button onClick={closeModal} disabled={formLoading} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">

              {/* Mensagens de erro/sucesso */}
              {formError && (
                <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-rose-700">{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-emerald-700">{formSuccess}</p>
                </div>
              )}

              {/* Campo nome */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Disciplina
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  maxLength={60}
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex. Matemática A, Física, Inglês…"
                  disabled={formLoading}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                />
              </div>

              {/* Selector de cor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cor da Disciplina
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.hex}
                      type="button"
                      onClick={() => selectColor(opt.hex, opt.color)}
                      disabled={formLoading}
                      title={opt.label}
                      className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                        formState.color_hex === opt.hex
                          ? 'ring-2 ring-offset-2 ring-slate-700 scale-110'
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: opt.hex }}
                    />
                  ))}
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center space-x-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
                    style={{ backgroundColor: formState.color_hex }}
                  >
                    {(formState.name.substring(0, 2) || '??').toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {formState.name.trim() || 'Nome da Disciplina'}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !!formSuccess}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm shadow-blue-100 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {formLoading ? (
                    <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
                  ) : (
                    <span>{modalMode === 'create' ? 'Criar Disciplina' : 'Guardar Alterações'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmação de Eliminação ──────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <div className="p-6 space-y-5">
              {/* Ícone de aviso */}
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-rose-500" />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Eliminar Disciplina</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tens a certeza que queres eliminar{' '}
                  <strong className="text-slate-800">"{deleteConfirm.subject.name}"</strong>?
                </p>
              </div>

              {/* Dependências */}
              {deleteConfirm.isLoadingDeps ? (
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin" />
                  <span>A verificar dados associados…</span>
                </div>
              ) : deleteConfirm.deps && (
                (() => {
                  const { contents: c, evaluations: e, scheduleSlots: s } = deleteConfirm.deps;
                  const total = c + e + s;
                  if (total === 0) return (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                      Nenhum dado associado. A eliminação é segura.
                    </div>
                  );
                  return (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-amber-700 flex items-center space-x-1">
                        <AlertTriangle size={13} />
                        <span>Esta disciplina tem dados associados que serão eliminados:</span>
                      </p>
                      <ul className="space-y-1 text-xs text-amber-800">
                        {c > 0 && <li>• {c} conteúdo{c !== 1 ? 's' : ''} de aula</li>}
                        {e > 0 && <li>• {e} avaliação{e !== 1 ? 'ões' : ''}</li>}
                        {s > 0 && <li>• {s} slot{s !== 1 ? 's' : ''} de horário</li>}
                      </ul>
                      <p className="text-xs font-semibold text-amber-700">Esta acção é irreversível.</p>
                    </div>
                  );
                })()
              )}

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => { if (!deleteLoading) setDeleteConfirm(null); }}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading || deleteConfirm.isLoadingDeps}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deleteLoading ? (
                    <><Loader2 size={14} className="animate-spin" /><span>A eliminar…</span></>
                  ) : (
                    <span>Sim, Eliminar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
