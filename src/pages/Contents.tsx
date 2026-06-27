/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contents.tsx — Módulo de Conteúdos Estudados (dados reais via Supabase)
 *
 * CRUD completo: criar, editar, eliminar conteúdos.
 * Upload de foto de caderno para Supabase Storage.
 * Lightbox para visualização de imagem em tamanho completo.
 * Loading, empty state, error state com design consistente.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText, Camera, Calendar, Save, Search, Trash2,
  Sparkles, Info, CheckCircle2, ListFilter, Pencil,
  X, Loader2, AlertTriangle, BookMarked, RefreshCw,
  Image as ImageIcon, ZoomIn, ChevronDown, ChevronUp,
} from 'lucide-react';

export const Contents: React.FC = () => {
  const {
    subjects,
    contents, contentsLoading, contentsError,
    addContent, editContent, removeContent,
    uploadPhoto, getSignedPhotoUrl,
    refreshContents,
  } = useApp();

  // ── Modo do formulário ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');

  // ── Estado do formulário (criar / editar) ──────────────────────────────────
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [subjectId, setSubjectId]         = useState('');
  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle]                 = useState('');
  const [description, setDescription]     = useState('');
  const [observations, setObservations]   = useState('');
  const [formError, setFormError]         = useState<string | null>(null);
  const [formSuccess, setFormSuccess]     = useState<string | null>(null);
  const [formLoading, setFormLoading]     = useState(false);

  // Inicializar subjectId com a primeira disciplina disponível
  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  // ── Estado de upload de foto ───────────────────────────────────────────────
  const [dragActive, setDragActive]       = useState(false);
  const [uploadedFile, setUploadedFile]   = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedPath, setUploadedPath]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Filtros da lista ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  // ── Modal de confirmação de eliminação ────────────────────────────────────
  const [deleteTarget, setDeleteTarget]   = useState<{ id: string; title: string; photoUrl?: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ── Lightbox de foto ──────────────────────────────────────────────────────
  const [lightboxUrl, setLightboxUrl]     = useState<string | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);

  // ── Cards expandidos ──────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds]     = useState<Set<string>>(new Set());

  // ── Resetar formulário ─────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setObservations('');
    setDate(new Date().toISOString().split('T')[0]);
    setSubjectId(subjects[0]?.id ?? '');
    setFormError(null);
    setFormSuccess(null);
    setUploadedFile(null);
    setUploadPreview(null);
    setUploadedPath(null);
    setActiveTab('manual');
  }, [subjects]);

  // ── Abrir edição ───────────────────────────────────────────────────────────
  const startEdit = (record: typeof contents[0]) => {
    setEditingId(record.id);
    setSubjectId(record.subjectId);
    setDate(record.date);
    setTitle(record.title);
    setDescription(record.description);
    setObservations(record.observations ?? '');
    setFormError(null);
    setFormSuccess(null);
    setUploadedFile(null);
    setUploadPreview(null);
    setUploadedPath(null);
    setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Upload de ficheiro ─────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFormError('Formato não suportado. Usa JPG, PNG, WEBP ou PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Ficheiro demasiado grande. Máximo 10 MB.');
      return;
    }

    setFormError(null);
    setUploadedFile(file);

    // Preview local imediato
    if (file.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }

    // Upload para o Storage
    setUploadLoading(true);
    try {
      const path = await uploadPhoto(file);
      setUploadedPath(path);
      setFormSuccess('Imagem carregada com sucesso!');
      setTimeout(() => setFormSuccess(null), 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha no upload.');
      setUploadedFile(null);
      setUploadPreview(null);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Submeter formulário ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!subjectId) { setFormError('Selecciona uma disciplina.'); return; }
    if (!title.trim()) { setFormError('O título é obrigatório.'); return; }
    if (!description.trim()) { setFormError('A descrição é obrigatória.'); return; }
    if (uploadLoading) { setFormError('Aguarda o upload da imagem.'); return; }

    setFormLoading(true);
    try {
      const sub = subjects.find(s => s.id === subjectId);

      if (editingId) {
        // Editar existente
        await editContent(editingId, {
          subjectId,
          title:       title.trim(),
          description: description.trim(),
          observations: observations.trim() || undefined,
          studyDate:   date,
          ...(uploadedPath && { photoPath: uploadedPath }),
        });
        setFormSuccess('Conteúdo actualizado com sucesso!');
      } else {
        // Criar novo
        await addContent({
          subjectId,
          title:          title.trim(),
          description:    description.trim(),
          observations:   observations.trim() || undefined,
          studyDate:      date,
          isPhotoUpload:  activeTab === 'camera',
          photoPath:      uploadedPath ?? undefined,
        });
        setFormSuccess(`Conteúdo de ${sub?.name ?? 'disciplina'} guardado!`);
      }

      setTimeout(resetForm, 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao guardar. Tenta novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Eliminar conteúdo ──────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeContent(deleteTarget.id, deleteTarget.photoUrl);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Abrir lightbox ─────────────────────────────────────────────────────────
  const openLightbox = async (photoUrl: string) => {
    setLightboxLoading(true);
    setLightboxUrl(null);
    try {
      const signedUrl = await getSignedPhotoUrl(photoUrl);
      setLightboxUrl(signedUrl);
    } catch {
      setLightboxUrl(photoUrl); // fallback
    } finally {
      setLightboxLoading(false);
    }
  };

  // ── Toggle expansão do card ────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filteredContents = contents.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.subjectName.toLowerCase().includes(q);
    const matchSubject = filterSubjectId === 'all' || c.subjectId === filterSubjectId;
    return matchSearch && matchSubject;
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {editingId ? '✏️ Editar Conteúdo' : 'Registrar Conteúdos'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Insere as matérias aprendidas na aula para que a Assistente IA gere exercícios de apoio.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={13} />
              <span>Cancelar Edição</span>
            </button>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'manual' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              <span>Manualmente</span>
            </button>
            <button
              onClick={() => { setActiveTab('camera'); setEditingId(null); }}
              className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'camera' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera size={14} />
              <span>Foto do Caderno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Erro global da lista */}
      {contentsError && !contentsLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm font-semibold text-rose-700">{contentsError}</p>
          </div>
          <button onClick={refreshContents} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer">
            <RefreshCw size={12} />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Formulário */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-slate-800 flex items-center">
            {activeTab === 'manual' ? (
              <><FileText size={18} className="text-blue-600 mr-2" /><span>{editingId ? 'Editar Ficha' : 'Nova Ficha de Sumário'}</span></>
            ) : (
              <><Camera size={18} className="text-violet-600 mr-2" /><span>Foto do Caderno</span></>
            )}
          </h3>

          {/* Área de foto (tab câmara) */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {uploadLoading ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                  <Loader2 size={28} className="animate-spin text-violet-500 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">A carregar imagem…</p>
                    <p className="text-[10px] text-slate-400 mt-1">Aguarda enquanto o ficheiro é enviado para o servidor.</p>
                  </div>
                </div>
              ) : uploadPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={uploadPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-white text-xs font-bold">Imagem carregada</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setUploadedFile(null); setUploadPreview(null); setUploadedPath(null); }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg transition cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : uploadedFile && !uploadPreview ? (
                // PDF sem preview
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">PDF carregado com sucesso!</p>
                    <p className="text-[10px] text-emerald-600">{uploadedFile.name}</p>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag}
                  onDragLeave={handleDrag} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragActive ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-xs font-extrabold text-slate-800">Arraste a foto do caderno para aqui</p>
                  <p className="text-[10px] text-slate-400 mt-1">ou clica para seleccionar</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP ou PDF · Máx. 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,application/pdf"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                </div>
              )}
            </div>
          )}

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

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Disciplina
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  disabled={formLoading || subjects.length === 0}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                >
                  {subjects.length === 0
                    ? <option>A carregar…</option>
                    : subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data de Estudo
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  disabled={formLoading}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Título do Conteúdo
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="ex. Equações de 2º Grau ou Biomas Terrestres"
                disabled={formLoading}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Descrição Detalhada / Resumo
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Introduza um resumo claro da aula, fórmulas centrais, conceitos chave e regras do professor…"
                disabled={formLoading}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition leading-relaxed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Observações / Trabalhos de Casa (Opcional)
              </label>
              <input
                type="text"
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="ex. Fazer os exercícios da página 14"
                disabled={formLoading}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading || uploadLoading || !title || !description}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer text-xs disabled:cursor-not-allowed"
            >
              {formLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
              ) : (
                <><Save size={14} /><span>{editingId ? 'Guardar Alterações' : 'Guardar Resumo de Notas'}</span></>
              )}
            </button>
          </form>
        </div>

        {/* Lista de conteúdos */}
        <div className="lg:col-span-7 space-y-4">

          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs grid sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-7 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Procurar nos resumos…"
                className="block w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="sm:col-span-5 flex items-center space-x-1.5">
              <ListFilter size={14} className="text-slate-400 shrink-0" />
              <select
                value={filterSubjectId}
                onChange={e => setFilterSubjectId(e.target.value)}
                className="block w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              >
                <option value="all">Todas as Matérias</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Loading skeletons */}
          {contentsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-20 bg-slate-200 rounded-full" />
                    <div className="h-3 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="space-y-1">
                    <div className="h-3 bg-slate-100 rounded" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!contentsLoading && !contentsError && contents.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                <BookMarked size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-700">Nenhum conteúdo ainda</p>
                <p className="text-xs text-slate-400 mt-1">Regista a tua primeira aula para começares a estudar com IA.</p>
              </div>
            </div>
          )}

          {/* Empty state (filtros sem resultado) */}
          {!contentsLoading && contents.length > 0 && filteredContents.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-150 text-center text-slate-400 space-y-2">
              <Info size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm">Nenhum resultado encontrado</p>
              <p className="text-xs">Tenta outro termo de pesquisa ou remove o filtro de disciplina.</p>
            </div>
          )}

          {/* Lista */}
          {!contentsLoading && filteredContents.map(record => {
            const sub = subjects.find(s => s.id === record.subjectId);
            const isExpanded = expandedIds.has(record.id);
            const isEditing  = editingId === record.id;
            const descLong   = record.description.length > 200;

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl border shadow-xs space-y-4 transition ${
                  isEditing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-150 hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Header do card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white shrink-0"
                          style={{ backgroundColor: sub?.colorHex ?? '#94a3b8' }}
                        >
                          {record.subjectName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                          <Calendar size={10} className="mr-1" />{record.date}
                        </span>
                        {record.isPhotoUpload && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700">
                            <Sparkles size={8} /><span>Foto</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-slate-900 text-sm">{record.title}</h4>
                    </div>

                    {/* Acções */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => startEdit(record)}
                        title="Editar"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: record.id, title: record.title, photoUrl: record.photoUrl })}
                        title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Miniatura da foto */}
                  {record.photoUrl && (
                    <button
                      onClick={() => openLightbox(record.photoUrl!)}
                      className="relative group block w-full max-h-32 rounded-xl overflow-hidden border border-slate-100 cursor-pointer"
                    >
                      <img
                        src={record.photoUrl}
                        alt="Foto do caderno"
                        className="w-full object-cover max-h-32"
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </button>
                  )}

                  {/* Descrição */}
                  <div className="text-slate-600 text-xs leading-relaxed">
                    {descLong && !isExpanded
                      ? `${record.description.substring(0, 200)}…`
                      : record.description
                    }
                  </div>

                  {/* Toggle expandir descrição longa */}
                  {descLong && (
                    <button
                      onClick={() => toggleExpand(record.id)}
                      className="flex items-center space-x-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {isExpanded ? <><ChevronUp size={11}/><span>Mostrar menos</span></> : <><ChevronDown size={11}/><span>Ler mais</span></>}
                    </button>
                  )}

                  {/* Observações */}
                  {record.observations && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-start gap-1.5">
                      <Info size={12} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-slate-600 leading-normal">
                        <span className="font-bold text-slate-500">Nota: </span>{record.observations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              <h3 className="font-display font-bold text-lg text-slate-900">Eliminar Conteúdo</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tens a certeza que queres eliminar <strong className="text-slate-800">"{deleteTarget.title}"</strong>?
                {deleteTarget.photoUrl && <span className="block mt-1 text-amber-600 text-xs font-semibold">A foto associada também será eliminada.</span>}
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
                {deleteLoading ? <><Loader2 size={14} className="animate-spin"/><span>A eliminar…</span></> : <span>Sim, Eliminar</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox de foto ─────────────────────────────────────────────────── */}
      {(lightboxLoading || lightboxUrl) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => { setLightboxUrl(null); setLightboxLoading(false); }}
        >
          {lightboxLoading ? (
            <Loader2 size={36} className="animate-spin text-white" />
          ) : lightboxUrl ? (
            <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
              <img
                src={lightboxUrl}
                alt="Foto do caderno"
                className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          ) : null}
        </div>
      )}

    </div>
  );
};
