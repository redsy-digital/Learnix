/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AIExerciseSession.tsx — Sessão de Exercícios com IA (Etapa 13)
 *
 * Fluxo: recebe a configuração já definida em AIStudy.tsx (disciplina,
 * conteúdos, dificuldade, nº questões, análise se já existir) →
 * gera exercícios via useAIExercises → permite responder, navegar,
 * revelar respostas → mostra resumo final com recomendação da IA.
 *
 * Toda a lógica está em useAIExercises.ts. Este componente é apresentação pura.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, Loader2, AlertTriangle, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Sparkles, RotateCcw, ArrowLeft,
  Clock, Target, TrendingUp, Award, Lightbulb, Circle,
  CheckCircle, ListChecks,
} from 'lucide-react';
import { useAIExercises, type GenerateExercisesArgs } from '../hooks/useAIExercises';
import type { Question } from '../ai/types/ai';

// ─── Estado passado via navigate() a partir de AIStudy.tsx ───────────────────

interface LocationState {
  generateArgs: GenerateExercisesArgs;
}

// ─── Componente: input de resposta consoante o tipo de questão ──────────────

function AnswerInput({
  question, currentAnswer, isRevealed, onAnswer,
}: {
  question: Question;
  currentAnswer: string | null;
  isRevealed: boolean;
  onAnswer: (a: string) => void;
}) {
  const [textValue, setTextValue] = useState(currentAnswer ?? '');

  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    return (
      <div className="space-y-2.5">
        {question.options?.map(opt => {
          const isSelected = currentAnswer === opt.id;
          const showCorrect = isRevealed && opt.isCorrect;
          const showWrong   = isRevealed && isSelected && !opt.isCorrect;
          return (
            <button
              key={opt.id}
              onClick={() => !isRevealed && onAnswer(opt.id)}
              disabled={isRevealed}
              className={`w-full text-left p-3.5 rounded-xl border-2 transition flex items-center space-x-3 ${
                showCorrect ? 'border-emerald-400 bg-emerald-50' :
                showWrong   ? 'border-rose-400 bg-rose-50' :
                isSelected  ? 'border-blue-500 bg-blue-50' :
                'border-slate-150 bg-white hover:border-slate-300'
              } ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                showCorrect ? 'bg-emerald-500 text-white' :
                showWrong   ? 'bg-rose-500 text-white' :
                isSelected  ? 'bg-blue-600 text-white' :
                'bg-slate-100 text-slate-500'
              }`}>
                {opt.id}
              </div>
              <span className="text-sm text-slate-700 flex-1">{opt.text}</span>
              {showCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
              {showWrong   && <XCircle size={18} className="text-rose-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // 'open', 'fill-blank', 'calculation'
  return (
    <div className="space-y-3">
      <textarea
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
        disabled={isRevealed}
        rows={question.type === 'calculation' ? 2 : 4}
        placeholder={question.type === 'calculation' ? 'Introduz o valor numérico…' : 'Escreve a tua resposta aqui…'}
        className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-70 resize-none"
      />
      {!isRevealed && (
        <button
          onClick={() => onAnswer(textValue)}
          disabled={!textValue.trim()}
          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2 rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
        >
          Confirmar Resposta
        </button>
      )}
      {isRevealed && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Resposta esperada</p>
          <p className="text-sm text-emerald-800">{question.correctAnswer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Componente: resumo final ─────────────────────────────────────────────────

function SessionSummaryView({
  summary, onRestart, onBackToStudy,
}: {
  summary: Awaited<ReturnType<ReturnType<typeof useAIExercises>['finishAndSummarize']>>;
  onRestart: () => void;
  onBackToStudy: () => void;
}) {
  const isPassing = summary.scorePercent >= 60;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
          isPassing ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          <Award size={36} className={isPassing ? 'text-emerald-500' : 'text-amber-500'} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-black text-slate-900">{summary.scorePercent}%</h1>
          <p className="text-sm text-slate-500 mt-1">
            {summary.correctCount} de {summary.totalQuestions} questões correctas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-150 text-center">
          <CheckCircle size={18} className="text-emerald-500 mx-auto mb-1" />
          <p className="font-display font-black text-lg text-slate-800">{summary.correctCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Acertos</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-150 text-center">
          <XCircle size={18} className="text-rose-500 mx-auto mb-1" />
          <p className="font-display font-black text-lg text-slate-800">{summary.incorrectCount}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Erros</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-150 text-center">
          <Clock size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="font-display font-black text-lg text-slate-800">
            {Math.floor(summary.durationSeconds / 60)}m{summary.durationSeconds % 60}s
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo</p>
        </div>
      </div>

      {summary.difficultTopics.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-2">
            <Target size={14} className="text-rose-500" />
            <span>Tópicos com Maior Dificuldade</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.difficultTopics.map((t, i) => (
              <span key={i} className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-tr from-blue-600 to-violet-700 p-5 rounded-2xl text-white space-y-2">
        <div className="flex items-center space-x-2">
          <Lightbulb size={16} className="fill-white" />
          <h3 className="font-display font-bold text-sm">Recomendação da IA</h3>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed">{summary.recommendation}</p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm py-3 rounded-xl transition cursor-pointer"
        >
          <RotateCcw size={15} /><span>Gerar Novos Exercícios</span>
        </button>
        <button
          onClick={onBackToStudy}
          className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft size={15} /><span>Nova Sessão</span>
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const AIExerciseSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const {
    phase, error, exercise,
    currentIndex, currentQuestion, answers,
    generate, answerQuestion, revealAnswer,
    nextQuestion, previousQuestion,
    isLastQuestion, isFirstQuestion,
    finishAndSummarize,
  } = useAIExercises();

  const [summary, setSummary] = useState<Awaited<ReturnType<typeof finishAndSummarize>> | null>(null);

  // Iniciar geração ao montar (config vem da navegação a partir de AIStudy)
  useEffect(() => {
    if (state?.generateArgs) {
      generate(state.generateArgs);
    } else {
      navigate('/estudo-ia', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentAnswerState = currentQuestion ? answers[currentQuestion.id] : null;

  const handleFinish = async () => {
    const result = await finishAndSummarize();
    setSummary(result);
  };

  const handleRestart = () => {
    if (state?.generateArgs) {
      setSummary(null);
      generate(state.generateArgs);
    }
  };

  // ── Resumo final ────────────────────────────────────────────────────────────
  if (summary) {
    return (
      <SessionSummaryView
        summary={summary}
        onRestart={handleRestart}
        onBackToStudy={() => navigate('/estudo-ia')}
      />
    );
  }

  // ── Loading: a analisar conteúdo (se necessário) ────────────────────────────
  if (phase === 'analysing') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
        <div>
          <p className="font-bold text-slate-800">A analisar o conteúdo…</p>
          <p className="text-xs text-slate-500 mt-1">Ainda não existia uma análise. O Gemini está a estudar o material primeiro.</p>
        </div>
      </div>
    );
  }

  // ── Loading: a gerar exercícios ──────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
          <Sparkles size={28} className="animate-pulse text-violet-500" />
        </div>
        <div>
          <p className="font-bold text-slate-800">A gerar exercícios…</p>
          <p className="text-xs text-slate-500 mt-1">O Gemini está a criar questões personalizadas com base na análise do conteúdo.</p>
        </div>
      </div>
    );
  }

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-rose-500" />
        </div>
        <div>
          <p className="font-bold text-slate-800">Não foi possível gerar os exercícios</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => state?.generateArgs && generate(state.generateArgs)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <RotateCcw size={13} /><span>Tentar Novamente</span>
          </button>
          <button
            onClick={() => navigate('/estudo-ia')}
            className="flex items-center space-x-1.5 border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft size={13} /><span>Voltar à Configuração</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Sem exercícios ainda (estado idle inesperado) ────────────────────────────
  if (!exercise || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <Loader2 size={24} className="animate-spin text-slate-300 mx-auto" />
      </div>
    );
  }

  // ── Questão actual ────────────────────────────────────────────────────────────
  const progressPct = Math.round(((currentIndex + 1) / exercise.questions.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header com progresso */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain size={18} className="text-blue-600" />
            <h1 className="font-display font-bold text-slate-900">{exercise.subjectName}</h1>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Questão {currentIndex + 1} de {exercise.questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Card da questão */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
              currentQuestion.difficulty === 'facil'   ? 'bg-emerald-100 text-emerald-700' :
              currentQuestion.difficulty === 'medio'   ? 'bg-blue-100 text-blue-700' :
              currentQuestion.difficulty === 'dificil' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {currentQuestion.difficulty.replace('_', ' ')}
            </span>
            {currentQuestion.topic && (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {currentQuestion.topic}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400">{currentQuestion.points} pts</span>
        </div>

        <p className="text-base text-slate-800 leading-relaxed font-medium">
          {currentQuestion.questionText}
        </p>

        {currentQuestion.hint && !currentAnswerState?.isRevealed && (
          <p className="text-xs text-slate-400 italic flex items-center space-x-1.5">
            <Lightbulb size={12} /><span>{currentQuestion.hint}</span>
          </p>
        )}

        <AnswerInput
          question={currentQuestion}
          currentAnswer={currentAnswerState?.studentAnswer ?? null}
          isRevealed={currentAnswerState?.isRevealed ?? false}
          onAnswer={answerQuestion}
        />

        {/* Resultado + explicação ao revelar */}
        {currentAnswerState?.studentAnswer && !currentAnswerState.isRevealed && (
          <button
            onClick={revealAnswer}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-3 rounded-xl transition cursor-pointer"
          >
            <ListChecks size={16} /><span>Ver Resposta e Explicação</span>
          </button>
        )}

        {currentAnswerState?.isRevealed && (
          <div className={`p-4 rounded-xl border space-y-2 ${
            currentAnswerState.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center space-x-2">
              {currentAnswerState.isCorrect
                ? <CheckCircle2 size={16} className="text-emerald-500" />
                : <XCircle size={16} className="text-rose-500" />
              }
              <span className={`text-xs font-extrabold ${currentAnswerState.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currentAnswerState.isCorrect ? 'Resposta Correcta!' : 'Resposta Incorrecta'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button
          onClick={previousQuestion}
          disabled={isFirstQuestion}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /><span>Anterior</span>
        </button>

        {/* Bolinhas de progresso */}
        <div className="flex items-center space-x-1.5">
          {exercise.questions.map((q, i) => {
            const state = answers[q.id];
            return (
              <div key={q.id} className={`w-2 h-2 rounded-full transition ${
                i === currentIndex ? 'bg-blue-600 w-4' :
                state?.isRevealed ? (state.isCorrect ? 'bg-emerald-400' : 'bg-rose-400') :
                state?.studentAnswer ? 'bg-slate-400' : 'bg-slate-200'
              }`} />
            );
          })}
        </div>

        {isLastQuestion ? (
          <button
            onClick={handleFinish}
            className="flex items-center space-x-1.5 text-xs font-bold bg-gradient-to-tr from-blue-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
          >
            <TrendingUp size={14} /><span>Ver Resumo</span>
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <span>Próxima</span><ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
