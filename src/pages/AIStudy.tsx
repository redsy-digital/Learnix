/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Brain,
  Lightbulb,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  BookmarkCheck,
  ChevronRight,
  Compass
} from 'lucide-react';

export const AIStudy: React.FC = () => {
  const { subjects, aiQuestions, generateAIQuestions, submitAIAnswer } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState('matematica');
  const [exerciseType, setExerciseType] = useState<'multiple-choice' | 'open' | 'calculation' | 'all'>('all');
  
  // Interactive UI states
  const [explanationActive, setExplanationActive] = useState<{ [qId: string]: boolean }>({});
  const [textAnswers, setTextAnswers] = useState<{ [qId: string]: string }>({});
  const [selectedChoice, setSelectedChoice] = useState<{ [qId: string]: string }>({});
  const [validatedQuestions, setValidatedQuestions] = useState<{ [qId: string]: boolean }>({});

  const handleGenerateQuestions = () => {
    generateAIQuestions(selectedSubjectId, exerciseType);
    // Reset interaction boards
    setExplanationActive({});
    setTextAnswers({});
    setSelectedChoice({});
    setValidatedQuestions({});
  };

  const handleChoiceSelect = (questionId: string, option: string) => {
    if (validatedQuestions[questionId]) return; // locked once validated
    setSelectedChoice((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleValidateExercise = (questionId: string, correctAnswer: string) => {
    setValidatedQuestions((prev) => ({ ...prev, [questionId]: true }));
    const answer = selectedChoice[questionId] || textAnswers[questionId] || '';
    submitAIAnswer(questionId, answer);
  };

  const toggleExplanation = (questionId: string) => {
    setExplanationActive((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleCreateMockSimulation = () => {
    // Generate simulated questions for active subject
    handleGenerateQuestions();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Brain className="text-violet-600 mr-2.5" size={24} /> Estudo Inteligente com IA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gera exames, revisões rápidas e questionários personalizados baseados unicamente nos teus conteúdos registrados.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateMockSimulation}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-150 transition cursor-pointer"
          >
            Criar Simulado Geral
          </button>
        </div>
      </div>

      {/* Control bar filters panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs grid sm:grid-cols-12 gap-4 items-end">
        
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Filtrar por Disciplina
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Tipologia de Exercício
          </label>
          <select
            value={exerciseType}
            onChange={(e) => setExerciseType(e.target.value as any)}
            className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition"
          >
            <option value="all">Ficha Completa (Mista)</option>
            <option value="multiple-choice">Escolha Múltipla</option>
            <option value="open">Perguntas de Desenvolvimento</option>
            <option value="calculation">Exercícios de Cálculo</option>
          </select>
        </div>

        <div className="sm:col-span-4 select-none">
          <button
            onClick={handleGenerateQuestions}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-tr from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-blue-100 cursor-pointer text-xs"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Gerar Exercícios com IA</span>
          </button>
        </div>

      </div>

      {/* Questions Workspace layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Generated question cards */}
        <div className="lg:col-span-8 space-y-4">
          {aiQuestions.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-150 shadow-xs text-center space-y-4">
              <Compass size={40} className="mx-auto text-slate-350" />
              <div>
                <h4 className="font-bold text-slate-800">Pronto para gerar perguntas?</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                  Selecione os critérios no painel e clique no botão de geração acima para iniciar o apoio escolar simulado de IA.
                </p>
              </div>
            </div>
          ) : (
            aiQuestions.map((q, idx) => {
              const isChoice = q.type === 'multiple-choice';
              const selection = selectedChoice[q.id] || '';
              const openAnswer = textAnswers[q.id] || '';
              const isValidated = validatedQuestions[q.id] || false;
              const subColors = subjects.find((s) => s.id === selectedSubjectId);

              return (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4 hover:border-slate-300 transition"
                >
                  {/* Badge Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400">Questão {idx + 1}</span>
                    <span
                      className="text-[9px] font-extrabold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: subColors?.colorHex || '#555' }}
                    >
                      {q.type === 'multiple-choice' && 'Escolha Múltipla'}
                      {q.type === 'open' && 'Resposta Aberta'}
                      {q.type === 'calculation' && 'Cálculo Académico'}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <p className="font-semibold text-slate-800 text-sm sm:text-base leading-relaxed">
                    {q.question}
                  </p>

                  {/* Interactive input area */}
                  {isChoice ? (
                    <div className="grid sm:grid-cols-2 gap-2 pt-2">
                      {q.options?.map((opt) => {
                        const isSelected = selection === opt;
                        return (
                          <button
                            key={opt}
                            disabled={isValidated}
                            onClick={() => handleChoiceSelect(q.id, opt)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold leading-relaxed transition ${
                              isValidated && opt === q.correctAnswer
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                : isValidated && isSelected && selection !== q.correctAnswer
                                ? 'bg-rose-50 border-rose-500 text-rose-800'
                                : isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-750 font-bold'
                                : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        disabled={isValidated}
                        value={openAnswer}
                        onChange={(e) => setTextAnswers({ ...textAnswers, [q.id]: e.target.value })}
                        placeholder={
                          q.type === 'calculation'
                            ? 'Insira o valor resolvido (ex. 6 ou 147)'
                            : 'Insira as suas conclusões detalhadas...'
                        }
                        className="block w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
                      />
                    </div>
                  )}

                  {/* Check action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {!isValidated ? (
                      <button
                        onClick={() => handleValidateExercise(q.id, q.correctAnswer)}
                        disabled={isChoice ? !selection : !openAnswer}
                        className="bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-3xs transition cursor-pointer"
                      >
                        Validar Resposta
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center space-x-1 px-3 py-1.8 bg-slate-100 rounded-xl text-slate-700 text-xs font-bold">
                          {isChoice && selection === q.correctAnswer ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle size={15} /> Excelente, Certo!
                            </span>
                          ) : isChoice ? (
                            <span className="text-rose-600 flex items-center gap-1">
                              <XCircle size={15} /> Incorreto
                            </span>
                          ) : (
                            <span className="text-blue-600 flex items-center gap-1">
                              <CheckCircle size={15} /> Resposta Validada!
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => toggleExplanation(q.id)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-750 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                        >
                          {explanationActive[q.id] ? 'Esconder Explicação' : 'Explicar Resposta'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Detailed Explanation block */}
                  {explanationActive[q.id] && (
                    <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl space-y-2 animate-fade-in text-xs">
                      <p className="font-bold text-violet-850 flex items-center">
                        <Lightbulb size={14} className="mr-1.5 text-violet-600" /> Resolução Detalhada pela IA:
                      </p>
                      <p className="text-violet-900 leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Right column: Instructions for study */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <BookmarkCheck size={18} className="text-blue-600" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Metodologia Exame</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-700">Como funciona o Tutor?</p>
              <p className="text-slate-500 leading-relaxed">
                Nossos simuladores leem os resumos que adicionas em "Conteúdos". Ao carregar na opção de gerar, ele prepara problemas práticos baseados de verdade na matéria dada na tua escola.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-700">Porquê praticar?</p>
              <p className="text-slate-500 leading-relaxed">
                A repetição espaçada e a prática ativa reduzem a ansiedade de exames e fixam fórmulas complexas de Química e Matemática no lobo temporal de forma permanente.
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 select-none">
              <p className="font-bold text-blue-700 flex items-center"><Sparkles size={12} className="mr-1" /> Dica de Estudo:</p>
              <p className="text-blue-600 leading-relaxed">
                Tira fotos das folhas das tuas aulas de Química e clique em Gerar Exercício para resolver fórmulas Kc imediatamente!
              </p>
            </div>

            <button
              onClick={handleGenerateQuestions}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-150 rounded-xl py-2.5 transition text-xs"
            >
              Gerar Novo Exercício Secundário
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
