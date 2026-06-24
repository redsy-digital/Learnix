/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardCheck,
  PlusCircle,
  TrendingUp,
  FileCheck2,
  Trash2,
  BookmarkPlus,
  BarChart,
  Calendar,
  AlertCircle
} from 'lucide-react';

const EVAL_TYPES = ['Prova', 'Trabalho', 'Exercício', 'Teste Surpresa', 'Participação'];

export const Evaluations: React.FC = () => {
  const { evaluations, subjects, addEvaluation } = useApp();

  // Form states
  const [subjectId, setSubjectId] = useState('matematica');
  const [type, setType] = useState<'Prova' | 'Trabalho' | 'Exercício' | 'Teste Surpresa' | 'Participação'>('Prova');
  const [date, setDate] = useState('2026-06-22');
  const [maxValue, setMaxValue] = useState(20);
  const [gradeObtained, setGradeObtained] = useState('');
  const [notes, setNotes] = useState('');

  // Local success alert
  const [success, setSuccess] = useState(false);

  const handleAddEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeObtained) return;

    const numericGrade = parseFloat(gradeObtained);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxValue) return;

    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    addEvaluation({
      subjectId,
      subjectName: sub.name,
      type,
      date,
      maxValue,
      gradeObtained: numericGrade,
      notes: notes || undefined
    });

    setGradeObtained('');
    setNotes('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Stats summaries
  const totalEvals = evaluations.length;
  const passedEvals = evaluations.filter((e) => (e.gradeObtained / e.maxValue) >= 0.5).length;
  const passRate = totalEvals > 0 ? Math.round((passedEvals / totalEvals) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Historial de Avaliações</h1>
          <p className="text-sm text-slate-500 mt-1">Registra notas de testes e exames para recalcular médias trimestrais instantaneamente.</p>
        </div>
        
        {/* Quick overall average values */}
        <div className="flex space-x-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-3xs shrink-0 select-none">
          <div className="px-3 border-r border-slate-200">
            <p className="font-bold text-slate-400 uppercase">Provas</p>
            <p className="font-display font-black text-slate-800 text-sm mt-0.5">{totalEvals} totais</p>
          </div>
          <div className="px-3">
            <p className="font-bold text-slate-400 uppercase">Taxa de Sucesso</p>
            <p className="font-display font-black text-emerald-600 text-sm mt-0.5">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 columns layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form: Add Evaluation */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center pr-2">
            <BookmarkPlus size={18} className="text-blue-600 mr-2" /> Nova Avaliação Escolar
          </h3>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 animate-pulse">
              Avaliação agendada e registrada com sucesso!
            </div>
          )}

          <form onSubmit={handleAddEvaluation} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Disciplina
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
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
                  Tipo de Prova
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
                >
                  {EVAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Data Realizada
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Escala Máx
                </label>
                <input
                  type="number"
                  required
                  value={maxValue}
                  onChange={(e) => setMaxValue(parseInt(e.target.value) || 20)}
                  className="block w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nota Obtida (0.0 a {maxValue}.0)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={gradeObtained}
                onChange={(e) => setGradeObtained(e.target.value)}
                placeholder="ex. 16.4"
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anotações ou Observações Adicionais
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex. Materiais consultados ou pontos a rever"
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={!gradeObtained}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs"
            >
              <ClipboardCheck size={14} />
              <span>Guardar Notas Clínicas</span>
            </button>
          </form>
        </div>

        {/* Right Pane: History of assessments */}
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Histórico Completo de Notas</p>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {evaluations.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 border border-slate-150 rounded-2xl">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={28} />
                <p className="font-semibold text-sm">Sem avaliações salvas</p>
                <p className="text-xs">Usa o painel lateral para registrar a tua primeira nota trimestral.</p>
              </div>
            ) : (
              evaluations.map((evalItem) => {
                const sub = subjects.find((s) => s.id === evalItem.subjectId);
                const isPassed = (evalItem.gradeObtained / evalItem.maxValue) >= 0.5;

                return (
                  <div
                    key={evalItem.id}
                    className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-3xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-350 transition"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white uppercase"
                          style={{ backgroundColor: sub?.colorHex || '#bbb' }}
                        >
                          {evalItem.subjectName}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">
                          {evalItem.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{evalItem.date}</p>
                      {evalItem.notes && (
                        <p className="text-[11px] leading-relaxed text-slate-500 italic">
                          "{evalItem.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Aproveitamento</span>
                        <p className={`font-display text-base font-black ${isPassed ? 'text-blue-600' : 'text-rose-600'}`}>
                          {evalItem.gradeObtained} <span className="text-[10px] text-slate-400 font-bold">/ {evalItem.maxValue}</span>
                        </p>
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
