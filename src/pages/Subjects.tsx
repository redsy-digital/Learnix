/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';

export const Subjects: React.FC = () => {
  const { subjects, contents, evaluations } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>('matematica');

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Filter components belonging to selected subject
  const subjectContents = contents.filter((c) => c.subjectId === selectedSubjectId);
  const subjectEvaluations = evaluations.filter((e) => e.subjectId === selectedSubjectId);

  // Calculate high stats for detail panel
  const totalWeightPoints = subjectEvaluations.reduce((sum, e) => sum + e.gradeObtained, 0);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">As Minhas Disciplinas</h1>
          <p className="text-sm text-slate-500 mt-1">Acompanha as tuas médias, o rendimento trimestral e histórico de atividades académicas.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 font-extrabold text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-1">
          <BookOpen size={14} />
          <span>{subjects.length} Disciplinas</span>
        </div>
      </div>

      {/* Grid: 2 columns layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: list of subjects */}
        <div className="lg:col-span-5 space-y-3">
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 scale-[1.01]'
                    : 'bg-white border-slate-150 text-slate-800 hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs ${
                      isSelected ? 'bg-white/15' : ''
                    }`}
                    style={!isSelected ? { backgroundColor: sub.colorHex } : undefined}
                  >
                    {sub.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">{sub.name}</h4>
                    <p className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-blue-105 text-blue-100' : 'text-slate-400'}`}>
                      {sub.contentsCount} conteúdos • {sub.evaluationsCount} avaliações
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-75">Média</p>
                    <p className="text-base font-black font-mono mt-0.5">{sub.average}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`transform transition group-hover:translate-x-0.5 ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right pane: Detalhe da disciplina */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden sticky top-20">
          {selectedSubject ? (
            <div className="divide-y divide-slate-100">
              
              {/* Detail Header */}
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
                      <Clock size={12} className="mr-1 inline" /> Última atividade: {selectedSubject.lastActivity}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-150 shadow-3xs text-center min-w-[70px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Média</p>
                    <p className="font-display text-lg font-black text-slate-800">{selectedSubject.average}</p>
                  </div>
                  <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-150 shadow-3xs text-center min-w-[70px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rendimento</p>
                    <p className="font-display text-lg font-black text-emerald-600">{selectedSubject.performance}%</p>
                  </div>
                </div>
              </div>

              {/* Progress and mini specs bar */}
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
                      style={{
                        backgroundColor: selectedSubject.colorHex,
                        width: `${selectedSubject.performance}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Registered Contents List */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                    <FileText size={14} className="mr-1.5" /> Conteúdos de Aula ({subjectContents.length})
                  </h4>
                </div>

                {subjectContents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhum conteúdo adicionado para esta disciplina.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {subjectContents.map((content) => (
                      <div
                        key={content.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-xl transition space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>{content.date}</span>
                          {content.isPhotoUpload && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.2 rounded-full">FOTO</span>
                          )}
                        </div>
                        <h5 className="font-bold text-slate-800">{content.title}</h5>
                        <p className="text-slate-500 leading-normal line-clamp-2">
                          {content.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evaluations History List */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                    <ClipboardCheck size={14} className="mr-1.5" /> Histórico de Notas ({subjectEvaluations.length})
                  </h4>
                </div>

                {subjectEvaluations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">Nenhuma avaliação registrada nesta disciplina.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {subjectEvaluations.map((evalItem) => (
                      <div
                        key={evalItem.id}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold bg-white border px-2 py-0.5 rounded-lg text-slate-500 uppercase">
                            {evalItem.type}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {evalItem.date}
                          </span>
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
              <p className="font-bold">Nenhuma disciplina selecionada</p>
              <p className="text-xs max-w-xs mx-auto">Selecione uma disciplina no painel lateral esquerdo para ler as avaliações, resumos e desempenho académico com inteligência artificial.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
