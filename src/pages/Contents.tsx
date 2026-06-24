/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Camera,
  Layers,
  Calendar,
  Save,
  Search,
  BookOpen,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

export const Contents: React.FC = () => {
  const { subjects, contents, addContent } = useApp();

  // Form states
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');
  const [subjectId, setSubjectId] = useState('matematica');
  const [date, setDate] = useState('2026-06-22');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');

  // OCR and Photo upload states
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrLog, setOcrLog] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Filter study history
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const sub = subjects.find((s) => s.id === subjectId);
    
    addContent({
      subjectId,
      subjectName: sub?.name || 'Geral',
      date,
      title,
      description,
      observations: observations || undefined,
      isPhotoUpload: activeTab === 'camera',
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setObservations('');
    setOcrSuccess(false);
  };

  const handleSimulateOCR = () => {
    setIsOcrProcessing(true);
    setOcrLog('A carregar imagem em alta definição...');
    
    setTimeout(() => {
      setOcrLog('A detectar linhas estruturais do caderno...');
    }, 1000);

    setTimeout(() => {
      setOcrLog('Motor IA a analisar fórmulas matemáticas e textuais...');
    }, 2000);

    setTimeout(() => {
      setIsOcrProcessing(false);
      setOcrSuccess(true);
      
      // Auto-populate with premium simulated chemistry or math content
      setSubjectId('quimica');
      setTitle('Equilíbrio Químico e Constante de Equilíbrio (Kc)');
      setDescription(
        'Estudo do Equilíbrio Químico em sistemas fechados a temperatura constante. Em muitas reações reversíveis, a velocidade da reação direta iguala-se à velocidade da reação inversa. A constante Kc é calculada pela razão entre o produto da concentração molar dos produtos e dos reagentes, elevados aos seus respetivos coeficientes estequiométricos.'
      );
      setObservations('Atenção: Água no estado líquido e compostos puros no estado sólido NÃO entram no cálculo de Kc.');
    }, 3500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSimulateOCR();
    }
  };

  // Filter contents
  const filteredContents = contents.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubjectId === 'all' || c.subjectId === filterSubjectId;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Registrar Conteúdos</h1>
          <p className="text-sm text-slate-500 mt-1">Insere as matérias aprendidas na aula para que a Assistente IA gere exercícios de apoio.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              activeTab === 'manual' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} />
            <span>Manualmente</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              activeTab === 'camera' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera size={14} />
            <span>Foto do Caderno</span>
          </button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: Add Content Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-slate-800 flex items-center">
            {activeTab === 'manual' ? (
              <>
                <FileText size={18} className="text-blue-600 mr-2" />
                <span>Nova Ficha de Sumário</span>
              </>
            ) : (
              <>
                <Camera size={18} className="text-violet-600 mr-2 animate-pulse" />
                <span>Digitalização com IA</span>
              </>
            )}
          </h3>

          {/* OCR loader or success displays */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {isOcrProcessing ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Processamento OCR Inteligente...</p>
                    <p className="text-[10px] text-slate-400 mt-1">{ocrLog}</p>
                  </div>
                </div>
              ) : ocrSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-emerald-800 flex items-center">
                    <CheckCircle2 size={14} className="mr-1.5" /> Sucesso na Extração OCR!
                  </p>
                  <p className="text-emerald-700 leading-normal">
                    Preenchemos o formulário abaixo automaticamente a partir das notas do caderno. Revise se julgar necessário.
                  </p>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <Camera size={36} className="mx-auto text-slate-350 mb-3" />
                  <p className="text-xs font-extrabold text-slate-800">Arraste a foto do caderno para aqui</p>
                  <p className="text-[10px] text-slate-400 mt-1">Suporta imagens JPG, PNG ou PDF</p>
                  
                  <div className="relative flex justify-center text-xs uppercase my-3.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-150"></div>
                    </div>
                    <span className="relative bg-white px-2 text-[10px] text-slate-400 font-bold">Ou carregue</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateOCR}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Simular Captura / Envio
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form wrapper */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Disciplina
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
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
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Equações de 2º Grau ou Biomas Terrestres"
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Introduza um resumo claro da aula, formulas centrais, conceitos chave e regras estipuladas pelo professor..."
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Observações / Fichas e Exercícios de Casa (Opcional)
              </label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="ex. Fazer o trabalho de casa da página 14 ou dever de biologia"
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={!title || !description}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-3xs cursor-pointer text-xs"
            >
              <Save size={14} />
              <span>Guardar Resumo de Notas</span>
            </button>
          </form>
        </div>

        {/* Right pane: Full Study History with actions */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filters card */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-3xs grid sm:grid-cols-12 gap-3 items-center">
            
            <div className="sm:col-span-7 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Procurar nos resumos..."
                className="block w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="sm:col-span-5 flex items-center space-x-1.5">
              <ListFilter size={14} className="text-slate-400 shrink-0" />
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="block w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              >
                <option value="all">Todas as Matérias</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History contents list */}
          <div className="space-y-3">
            {filteredContents.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-150 text-center text-slate-400 space-y-2">
                <Info size={32} className="mx-auto text-slate-300" />
                <p className="font-bold text-sm">Nenhum resumo encontrado</p>
                <p className="text-xs">Insira um novo conteúdo manual ou simule foto ao lado para obter conteúdos interativos para estudo.</p>
              </div>
            ) : (
              filteredContents.map((record) => {
                const sub = subjects.find((s) => s.id === record.subjectId);
                return (
                  <div
                    key={record.id}
                    className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white"
                            style={{ backgroundColor: sub?.colorHex || '#94a3b8' }}
                          >
                            {record.subjectName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{record.date}</span>
                          {record.isPhotoUpload && (
                            <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700">
                              <Sparkles size={8} />
                              <span>IA OCR</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">{record.title}</h4>
                      </div>
                    </div>

                    <div className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
                      {record.description}
                    </div>

                    {record.observations && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-start gap-1.5 line-clamp-1">
                        <p className="text-slate-700 leading-normal">
                          <span className="font-bold text-slate-500">Nota Escolar:</span> {record.observations}
                        </p>
                      </div>
                    )}
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
