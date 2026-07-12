/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AIStudy.tsx — Sessão de Estudo IA
 * Toda a lógica em useAIStudySession.ts. Apenas apresentação aqui.
 */

import React, { useState } from 'react';
import {
  Brain, Sparkles, BookOpen, Calendar, Target, Clock,
  Zap, ChevronDown, ChevronUp, CheckSquare, Square,
  CheckCircle2, AlertTriangle, Loader2, RotateCcw,
  Lightbulb, Award, BookMarked, ArrowRight, ListChecks, Cpu,
} from 'lucide-react';
import {
  useAIStudySession,
  SESSION_TYPE_LABELS, DIFFICULTY_LABELS, STUDY_GOAL_LABELS,
  STUDY_TIME_LABELS, CONTENT_PRIORITY_LABELS,
  type SessionType, type StudyGoal, type StudyTime,
  type ContentPriority, type SessionConfig, type PeriodFilter,
} from '../hooks/useAIStudySession';

const isDev = import.meta.env.DEV;

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center space-x-2 mb-3">
      <div className="text-blue-600">{icon}</div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
    </div>
  );
}

function VerticalSelector<T extends string>({
  options, value, onChange, labelMap,
}: { options: readonly T[]; value: T; onChange: (v: T) => void; labelMap: Record<string, string> }) {
  return (
    <div className="space-y-1.5">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`w-full text-left text-xs font-bold px-3 py-2 rounded-lg border transition cursor-pointer ${
            value === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
          }`}>
          {labelMap[opt]}
        </button>
      ))}
    </div>
  );
}

export const AIStudy: React.FC = () => {
  const {
    subjects, config,
    setSubject, setPeriodFilter, setPeriodStart, setPeriodEnd,
    setSessionType, setDifficulty, setQuestionCount,
    setStudyGoal, setStudyTime, setContentPriority,
    filteredContents, toggleContent, selectAllContents, deselectAllContents, isContentSelected,
    isAnalysing, analysisError, analysis, tokensUsed, latencyMs,
    canAnalyse, runAnalysis, resetAnalysis, resetSession,
  } = useAIStudySession();

  const [contentsExpanded, setContentsExpanded] = useState(true);
  const selectedSubject = subjects.find(s => s.id === config.subjectId);
  const selectedCount   = config.selectedContentIds.length;

  const PERIOD_LABELS: Record<PeriodFilter, string> = {
    '7d': 'Últimos 7 dias', '15d': 'Últimos 15 dias', '30d': 'Últimos 30 dias',
    'specific': 'Data específica', 'range': 'Intervalo', 'all': 'Todo o período',
  };

  /* ── RESULTADO DA ANÁLISE ─────────────────────────────────────────────────── */
  if (analysis) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">Análise Concluída</h1>
            </div>
            <p className="text-sm text-slate-500">
              {selectedSubject?.name} · {selectedCount} conteúdo{selectedCount !== 1 ? 's' : ''} analisado{selectedCount !== 1 ? 's' : ''}
              {isDev && tokensUsed > 0 && (
                <span className="ml-2 text-[10px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
                  DEV: {tokensUsed} tokens · {latencyMs}ms
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={resetAnalysis} className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition cursor-pointer">
              <RotateCcw size={13} /><span>Analisar Novamente</span>
            </button>
            <button onClick={resetSession} className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition cursor-pointer">
              <ArrowRight size={13} /><span>Nova Sessão</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Disciplina',  value: selectedSubject?.name ?? '—' },
            { label: 'Tipo',        value: SESSION_TYPE_LABELS[config.sessionType] },
            { label: 'Questões',    value: `${config.questionCount} questões` },
            { label: 'Dificuldade', value: DIFFICULTY_LABELS[config.difficulty] },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">

            {/* Tópico principal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tópico Principal</p>
                  <h2 className="font-display font-bold text-lg text-slate-900 leading-snug">{analysis.contentTitle}</h2>
                  <p className="text-xs text-slate-500 mt-1">{analysis.subject}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                  analysis.suggestedDifficulty === 'facil' ? 'bg-emerald-100 text-emerald-700' :
                  analysis.suggestedDifficulty === 'medio' ? 'bg-blue-100 text-blue-700' :
                  analysis.suggestedDifficulty === 'dificil' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>{DIFFICULTY_LABELS[analysis.suggestedDifficulty]}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{analysis.topicSummary}</p>
            </div>

            {/* Objectivos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
              <SectionTitle icon={<Target size={16} />} label="Objectivos de Aprendizagem" />
              <div className="space-y-2">
                {analysis.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-blue-50/60 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{obj.description}</p>
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-1 block">Bloom: {obj.bloomLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conceitos-chave */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
              <SectionTitle icon={<Lightbulb size={16} />} label="Conceitos-Chave" />
              <div className="grid sm:grid-cols-2 gap-3">
                {analysis.keyConcepts.map((kc, i) => (
                  <div key={i} className={`p-3.5 rounded-xl border space-y-1.5 ${
                    kc.importance === 'high' ? 'bg-amber-50/70 border-amber-150' :
                    kc.importance === 'medium' ? 'bg-slate-50 border-slate-150' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-slate-800 leading-tight">{kc.term}</p>
                      <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        kc.importance === 'high' ? 'bg-amber-200 text-amber-800' :
                        kc.importance === 'medium' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'
                      }`}>{kc.importance === 'high' ? '★ Alta' : kc.importance === 'medium' ? 'Média' : 'Baixa'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{kc.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dicas */}
            {analysis.studyTips.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <SectionTitle icon={<Award size={16} />} label="Recomendações da IA" />
                <ul className="space-y-2.5">
                  {analysis.studyTips.map((tip, i) => (
                    <li key={i} className="flex items-start space-x-2.5">
                      <Sparkles size={13} className="text-violet-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-5">
            {/* Tópicos relacionados */}
            {(analysis.relatedTopics?.length ?? 0) > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <SectionTitle icon={<BookOpen size={15} />} label="Tópicos Relacionados" />
                <div className="flex flex-wrap gap-2">
                  {analysis.relatedTopics!.map((t, i) => (
                    <span key={i} className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Próximas funcionalidades */}
            <div className="bg-gradient-to-tr from-blue-600 to-violet-700 p-5 rounded-2xl text-white space-y-4">
              <div className="flex items-center space-x-2">
                <Zap size={18} className="fill-white text-white" />
                <h3 className="font-display font-bold text-sm">Próximas Funcionalidades</h3>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Esta análise será usada para gerar exercícios, flashcards e simulados personalizados com o Gemini nas próximas etapas.
              </p>
              <div className="space-y-2 pt-1">
                {['Gerar Exercícios', 'Criar Flashcards', 'Montar Simulado'].map((step, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs font-bold text-blue-200/70">
                    <div className="w-5 h-5 rounded-full border border-blue-400/50 flex items-center justify-center text-[9px] text-blue-300/70 shrink-0">{i + 1}</div>
                    <span>{step}</span>
                    <span className="ml-auto text-[9px] bg-white/10 px-2 py-0.5 rounded-full">Em breve</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEV */}
            {isDev && (
              <div className="bg-slate-900 p-4 rounded-xl font-mono text-[10px] space-y-1">
                <p className="text-slate-400 font-bold mb-2">{'// DEV — Metadata'}</p>
                <p className="text-emerald-400">provider: <span className="text-white">gemini</span></p>
                <p className="text-emerald-400">model: <span className="text-white">gemini-2.5-flash</span></p>
                <p className="text-emerald-400">tokens: <span className="text-white">{tokensUsed}</span></p>
                <p className="text-emerald-400">latency: <span className="text-white">{latencyMs}ms</span></p>
                <p className="text-emerald-400">concepts: <span className="text-white">{analysis.keyConcepts.length}</span></p>
                <p className="text-emerald-400">objectives: <span className="text-white">{analysis.learningObjectives.length}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── PAINEL DE CONFIGURAÇÃO ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-700 flex items-center justify-center shadow-md shadow-blue-100">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Sessão de Estudo IA</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configura a sessão e deixa o Gemini 2.5 Flash analisar os teus conteúdos.</p>
          </div>
        </div>
      </div>

      {/* Erro */}
      {analysisError && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700">Erro na análise</p>
            <p className="text-xs text-rose-600 mt-0.5">{analysisError}</p>
          </div>
          <button onClick={resetAnalysis} className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer shrink-0">Fechar</button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">

        {/* Coluna esquerda — configuração */}
        <div className="lg:col-span-7 space-y-5">

          {/* 1. Disciplina */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
            <SectionTitle icon={<BookOpen size={16} />} label="1. Disciplina" />
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Cria disciplinas primeiro.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjects.map(sub => (
                  <button key={sub.id} onClick={() => setSubject(sub.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.subjectId === sub.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-150 hover:border-blue-200 hover:bg-slate-50/50'
                    }`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.colorHex }} />
                      <span className="text-xs font-bold text-slate-800 truncate">{sub.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{sub.contentsCount} conteúdo{sub.contentsCount !== 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Período */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
            <SectionTitle icon={<Calendar size={16} />} label="2. Período" />
            <div className="flex flex-wrap gap-2">
              {(['7d','15d','30d','specific','range','all'] as PeriodFilter[]).map(p => (
                <button key={p} onClick={() => setPeriodFilter(p)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    config.periodFilter === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}>{PERIOD_LABELS[p]}</button>
              ))}
            </div>
            {config.periodFilter === 'specific' && (
              <input type="date" value={config.periodStart ?? ''} onChange={e => setPeriodStart(e.target.value)}
                className="mt-3 text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition" />
            )}
            {config.periodFilter === 'range' && (
              <div className="flex items-center space-x-2 mt-3">
                <input type="date" value={config.periodStart ?? ''} onChange={e => setPeriodStart(e.target.value)}
                  className="flex-1 text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition" />
                <span className="text-slate-400 text-xs font-semibold">até</span>
                <input type="date" value={config.periodEnd ?? ''} onChange={e => setPeriodEnd(e.target.value)}
                  className="flex-1 text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition" />
              </div>
            )}
          </div>

          {/* 3. Conteúdos */}
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden">
            <button className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition text-left"
              onClick={() => setContentsExpanded(e => !e)}>
              <div className="flex items-center space-x-2">
                <ListChecks size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">3. Conteúdos</span>
                {selectedCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">{selectedCount}</span>
                )}
              </div>
              {contentsExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {contentsExpanded && (
              <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                {filteredContents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    {config.subjectId ? 'Nenhum conteúdo para esta disciplina e período.' : 'Selecciona uma disciplina primeiro.'}
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-xs text-slate-500">{filteredContents.length} disponíve{filteredContents.length !== 1 ? 'is' : 'l'}</p>
                      <div className="flex items-center space-x-3">
                        <button onClick={selectAllContents} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer">Seleccionar todos</button>
                        {selectedCount > 0 && (
                          <button onClick={deselectAllContents} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer">Limpar</button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {filteredContents.map(c => {
                        const sel = isContentSelected(c.id);
                        return (
                          <button key={c.id} onClick={() => toggleContent(c.id)}
                            className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                              sel ? 'bg-blue-50 border-blue-300 shadow-xs' : 'bg-white border-slate-150 hover:border-slate-300'
                            }`}>
                            <div className="shrink-0 mt-0.5">
                              {sel ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} className="text-slate-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{c.date} · {c.description.substring(0, 55)}{c.description.length > 55 ? '…' : ''}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 4. Tipo de sessão */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
            <SectionTitle icon={<Sparkles size={16} />} label="4. Tipo de Avaliação" />
            <div className="flex flex-wrap gap-2">
              {(['exercises','mini-test','simulation','quick-review','flashcards'] as SessionType[]).map(t => (
                <button key={t} onClick={() => setSessionType(t)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    config.sessionType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}>{SESSION_TYPE_LABELS[t]}</button>
              ))}
            </div>
            {config.sessionType !== 'exercises' && (
              <p className="text-[10px] text-amber-600 font-semibold mt-2.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                Disponível numa próxima etapa. Por agora, apenas "Analisar Conteúdo" está activo.
              </p>
            )}
          </div>

          {/* 5–6. Grelha de configurações avançadas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
              <SectionTitle icon={<Zap size={15} />} label="Dificuldade" />
              <VerticalSelector
                options={['facil','medio','dificil','muito_dificil','mixed'] as (SessionConfig['difficulty'])[]}
                value={config.difficulty} onChange={setDifficulty} labelMap={DIFFICULTY_LABELS} />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
              <SectionTitle icon={<ListChecks size={15} />} label="Nº de Questões" />
              <div className="grid grid-cols-3 gap-2">
                {([5,10,15,20,30] as SessionConfig['questionCount'][]).map(n => (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    className={`text-sm font-bold py-2.5 rounded-xl border transition cursor-pointer ${
                      config.questionCount === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}>{n}</button>
                ))}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
              <SectionTitle icon={<Target size={15} />} label="Objectivo de Estudo" />
              <VerticalSelector options={Object.keys(STUDY_GOAL_LABELS) as StudyGoal[]}
                value={config.studyGoal} onChange={setStudyGoal} labelMap={STUDY_GOAL_LABELS} />
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                <SectionTitle icon={<Clock size={15} />} label="Tempo Disponível" />
                <VerticalSelector options={Object.keys(STUDY_TIME_LABELS) as StudyTime[]}
                  value={config.studyTime} onChange={setStudyTime} labelMap={STUDY_TIME_LABELS} />
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                <SectionTitle icon={<BookMarked size={15} />} label="Priorizar" />
                <VerticalSelector options={Object.keys(CONTENT_PRIORITY_LABELS) as ContentPriority[]}
                  value={config.contentPriority} onChange={setContentPriority} labelMap={CONTENT_PRIORITY_LABELS} />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita — resumo + acção */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Cpu size={16} className="text-blue-600" /><span>Resumo da Sessão</span>
            </h3>
            <div className="divide-y divide-slate-50">
              {[
                { label: 'Disciplina',  value: selectedSubject?.name ?? '—' },
                { label: 'Conteúdos',   value: selectedCount > 0 ? `${selectedCount} seleccionado${selectedCount !== 1 ? 's' : ''}` : 'Nenhum', warn: selectedCount === 0 },
                { label: 'Período',     value: PERIOD_LABELS[config.periodFilter] },
                { label: 'Tipo',        value: SESSION_TYPE_LABELS[config.sessionType] },
                { label: 'Questões',    value: `${config.questionCount} questões` },
                { label: 'Dificuldade', value: DIFFICULTY_LABELS[config.difficulty] },
                { label: 'Tempo',       value: STUDY_TIME_LABELS[config.studyTime] },
                { label: 'Objectivo',   value: STUDY_GOAL_LABELS[config.studyGoal] },
              ].map(({ label, value, warn }) => (
                <div key={label} className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-400 font-semibold">{label}</span>
                  <span className={`text-xs font-bold ${(warn ?? false) ? 'text-amber-600' : 'text-slate-700'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={runAnalysis} disabled={!canAnalyse}
            className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-bold text-sm transition shadow-md cursor-pointer ${
              canAnalyse
                ? 'bg-gradient-to-tr from-blue-600 to-violet-700 hover:from-blue-700 hover:to-violet-800 text-white shadow-blue-200/60'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}>
            {isAnalysing ? (
              <><Loader2 size={18} className="animate-spin" /><span>A analisar com Gemini…</span></>
            ) : (
              <><Brain size={18} /><span>Analisar Conteúdo</span><Sparkles size={14} className={canAnalyse ? 'text-violet-200' : 'text-slate-300'} /></>
            )}
          </button>

          {!canAnalyse && !isAnalysing && (
            <p className="text-center text-xs text-amber-600 font-semibold -mt-2">
              Selecciona pelo menos um conteúdo para continuar.
            </p>
          )}

          <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl space-y-2">
            <p className="text-xs font-bold text-violet-700 flex items-center space-x-1.5">
              <Sparkles size={12} className="text-violet-500" /><span>O que acontece ao clicar?</span>
            </p>
            <p className="text-[11px] text-violet-600 leading-relaxed">
              O Gemini 2.5 Flash analisa os conteúdos seleccionados, identifica conceitos-chave, objectivos de aprendizagem e recomenda uma estratégia personalizada. Esta análise é a base para exercícios e simulados nas próximas etapas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
