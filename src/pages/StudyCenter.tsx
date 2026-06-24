/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Play,
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowRight,
  BrainCircuit,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const StudyCenter: React.FC = () => {
  const navigate = useNavigate();
  const { subjects, contents, evaluations } = useApp();

  // Mock list of pending exercises
  const [pendingExercises, setPendingExercises] = useState([
    { id: 'pe1', title: 'Ficha de Derivadas (Regra da Cadeia)', subject: 'Matemática', limit: 'Amanhã', solved: false },
    { id: 'pe2', title: 'Resumo sobre o Canto V de "Os Lusíadas"', subject: 'Português', limit: 'Em 2 dias', solved: false },
    { id: 'pe3', title: 'Exercícios de Termoquímica (Página 122)', subject: 'Química', limit: 'Em 4 dias', solved: false },
    { id: 'pe4', title: 'Questionário Prático de Dinâmica', subject: 'Física', limit: 'Concluído', solved: true }
  ]);

  const handleToggleSolve = (id: string) => {
    setPendingExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, solved: !ex.solved } : ex))
    );
  };

  const handleContinueStudy = () => {
    navigate('/estudo-ia');
  };

  // AI recommendations based on lowest grades or high priority
  const aiRecommendations = [
    {
      id: 'rec1',
      title: 'Melhoria em História',
      description: 'A tua média de 13.9 pode subir! Que tal um simulado rápido de 5 perguntas sobre a Primeira Guerra Mundial?',
      subjectId: 'historia',
      subjectName: 'História',
      difficulty: 'Médio',
    },
    {
      id: 'rec2',
      title: 'Aprofundamento de Matemática',
      description: 'Como revisaste as Derivadas hoje, preparei 10 exercícios da Regra da Cadeia para fixar no cérebro.',
      subjectId: 'matematica',
      subjectName: 'Matemática',
      difficulty: 'Dificil',
    },
    {
      id: 'rec3',
      title: 'Revisão Rápida de Biologia',
      description: 'Miniteste de Mitose Celular gerado para apoiar os teus exames nacionais da próxima semana.',
      subjectId: 'biologia',
      subjectName: 'Biologia',
      difficulty: 'Fácil',
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Hero style */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full filter blur-xl pointer-events-none"></div>
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-1 border border-white/20 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold">
            <GraduationCap size={12} />
            <span>UNIVERSO ACADÉMICO COHESO</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Central de Apoio ao Estudo</h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Bem-vindo ao teu centro de alto rendimento. Aqui, a inteligência artificial reúne os teus sumários para sugerir mini-testes adaptivos.
          </p>
        </div>

        <button
          onClick={handleContinueStudy}
          className="relative z-10 shrink-0 bg-white hover:bg-slate-50 text-indigo-700 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition cursor-pointer"
        >
          <Play size={14} className="fill-indigo-700 text-indigo-700" />
          <span>Continuar Estudando</span>
        </button>
      </div>

      {/* Grid: 2 columns layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column - Recommendations / Simulators */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI recommendations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800 flex items-center">
                  <Sparkles size={16} className="text-violet-600 mr-2" /> Recomendações da Assistente IA
                </h3>
                <p className="text-xs text-slate-400">Algoritmo preditivo de tópicos estruturados para a tua média do 11º Ano</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {aiRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-xl transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-extrabold tracking-wider bg-violet-100 text-violet-750 px-2 py-0.5 rounded-md uppercase">
                        {rec.subjectName}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{rec.difficulty}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{rec.title}</h4>
                    <p className="text-slate-505 text-slate-550 text-xs leading-relaxed">{rec.description}</p>
                  </div>

                  <Link
                    to="/estudo-ia"
                    className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 space-x-1 self-start group"
                  >
                    <span>Abrir Simulador IA</span>
                    <ArrowRight size={12} className="transform transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent studied subjects log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base flex items-center">
              <Clock size={16} className="text-blue-600 mr-2" /> Histórico Académico Recente
            </h3>

            <div className="space-y-2">
              {contents.slice(0, 3).map((item) => {
                const sub = subjects.find((s) => s.id === item.subjectId);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/40 border border-slate-100 rounded-xl transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: sub?.colorHex || '#ddd' }}></div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{item.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{item.subjectName} • {item.date}</p>
                      </div>
                    </div>
                    <Link
                      to="/conteudos"
                      className="text-xs font-extrabold text-slate-500 hover:text-slate-850"
                    >
                      Rever Notas
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column - Tasks Checklist */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pending Tasks Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-800 flex items-center">
                <ClipboardList size={16} className="text-indigo-600 mr-2" /> Exercícios Pendentes
              </h3>
              <p className="text-xs text-slate-400">Trabalhos e fichas escolares ativas</p>
            </div>

            <div className="space-y-3">
              {pendingExercises.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleSolve(task.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    task.solved
                      ? 'bg-slate-50 border-slate-150 opacity-60'
                      : 'bg-white border-slate-150 hover:bg-slate-50/50 shadow-3xs'
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="pt-0.5">
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center text-white transition ${
                        task.solved ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {task.solved && <CheckCircle size={11} className="text-white shrink-0" />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${
                        task.solved ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}>
                        {task.title}
                      </p>
                      <span className="text-[9px] font-bold text-slate-400">
                        {task.subject}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    task.solved
                      ? 'bg-emerald-100 text-emerald-800'
                      : task.limit === 'Amanhã'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {task.limit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Mini Tests Completed logs list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-xs sm:text-sm flex items-center">
              <FileCheck size={16} className="text-emerald-500 mr-2" /> Simulados Efetuados
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Quiz: Regra da Cadeia</p>
                  <p className="text-[9px] text-slate-400">Matemática • 3 perguntas</p>
                </div>
                <span className="font-display font-black text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  3/3 Certas
                </span>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Miniteste: Divisão Celular</p>
                  <p className="text-[9px] text-slate-400">Biologia • 2 perguntas</p>
                </div>
                <span className="font-display font-black text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  2/2 Certas
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
