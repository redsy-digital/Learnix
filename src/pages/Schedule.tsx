/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Schedule.tsx — Módulo de Horário Escolar (dados reais via Supabase)
 *
 * CRUD completo: criar, editar, eliminar slots de horário.
 * Validação de overlap no cliente (feedback imediato) + constraint do DB (segurança).
 * Loading, empty state, error state com design consistente.
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { CreateScheduleSlotPayload, UpdateScheduleSlotPayload } from '../services/scheduleService';
import {
  Clock, Plus, Trash2, MapPin, Sparkles, Info,
  Pencil, X, Loader2, AlertTriangle, CheckCircle2,
  RefreshCw, CalendarOff,
} from 'lucide-react';

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export const Schedule: React.FC = () => {
  const {
    subjects,
    schedule, scheduleLoading, scheduleError,
    addScheduleSlot, editScheduleSlot, removeScheduleSlot,
    checkScheduleOverlap, refreshSchedule,
  } = useApp();

  // ── Estado do formulário ───────────────────────────────────────────────────
  const [formOpen, setFormOpen]           = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [day, setDay]                     = useState('Segunda');
  const [startTime, setStartTime]         = useState('08:00');
  const [endTime, setEndTime]             = useState('09:30');
  const [subjectId, setSubjectId]         = useState('');
  const [room, setRoom]                   = useState('');
  const [formError, setFormError]         = useState<string | null>(null);
  const [formSuccess, setFormSuccess]     = useState<string | null>(null);
  const [formLoading, setFormLoading]     = useState(false);

  // Inicializar subjectId com a primeira disciplina disponível
  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  // ── Modal de eliminação ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget]   = useState<{ id: string; label: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ── Resetar formulário ─────────────────────────────────────────────────────
  const resetForm = () => {
    setEditingId(null);
    setDay('Segunda');
    setStartTime('08:00');
    setEndTime('09:30');
    setSubjectId(subjects[0]?.id ?? '');
    setRoom('');
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(false);
  };

  // ── Abrir edição ───────────────────────────────────────────────────────────
  const startEdit = (slot: typeof schedule[0]) => {
    const [start, end] = slot.time.split(' - ');
    setEditingId(slot.id);
    setDay(slot.day);
    setStartTime(start);
    setEndTime(end);
    setSubjectId(slot.subjectId);
    setRoom(slot.room ?? '');
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submeter formulário ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!subjectId)            { setFormError('Selecciona uma disciplina.'); return; }
    if (!startTime || !endTime){ setFormError('Indica a hora de início e de fim.'); return; }
    if (endTime <= startTime)  { setFormError('A hora de término deve ser depois da hora de início.'); return; }

    // Validação de overlap no cliente (feedback imediato, antes de ir ao DB)
    if (checkScheduleOverlap(day, startTime, endTime, editingId ?? undefined)) {
      setFormError('Já existe uma aula nesse horário. Os horários não podem sobrepor-se.');
      return;
    }

    setFormLoading(true);
    try {
      const sub = subjects.find(s => s.id === subjectId);

      if (editingId) {
        const payload: UpdateScheduleSlotPayload = {
          subjectId, dayName: day, startTime, endTime,
          room: room || undefined,
        };
        await editScheduleSlot(editingId, payload);
        setFormSuccess('Aula actualizada com sucesso!');
      } else {
        const payload: CreateScheduleSlotPayload = {
          subjectId, dayName: day, startTime, endTime,
          room: room || undefined,
        };
        await addScheduleSlot(payload);
        setFormSuccess(`Aula de ${sub?.name ?? 'disciplina'} agendada!`);
      }
      setTimeout(resetForm, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao guardar. Tenta novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Eliminar slot ───────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeScheduleSlot(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao eliminar.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalSlots = schedule.length;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Horário Escolar Semanal</h1>
          <p className="text-sm text-slate-500 mt-1">Desenha e organiza a tua agenda semanal escolar de aulas e salas de estudo.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          {!scheduleLoading && (
            <div className="bg-blue-50 text-blue-700 font-extrabold text-xs px-3.5 py-1.5 rounded-full">
              {totalSlots} {totalSlots === 1 ? 'aula' : 'aulas'}
            </div>
          )}
          <button
            onClick={() => { if (formOpen) resetForm(); else setFormOpen(true); }}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            {formOpen ? <X size={15} /> : <Plus size={15} />}
            <span>{formOpen ? 'Fechar Editor' : 'Adicionar Aula'}</span>
          </button>
        </div>
      </div>

      {/* Erro global */}
      {scheduleError && !scheduleLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0" />
            <p className="text-sm font-semibold text-rose-700">{scheduleError}</p>
          </div>
          <button onClick={refreshSchedule} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer">
            <RefreshCw size={12} /><span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* Formulário inline */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 rounded-2xl border border-blue-200/60 shadow-md space-y-4"
        >
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
            <Sparkles size={16} className="text-blue-500 mr-2" />
            {editingId ? 'Editar Aula' : 'Adicionar Turno Escolar'}
          </h3>

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

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Dia da Semana
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={formLoading}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              >
                {WEEKDAYS.map((d) => <option key={d} value={d}>{d}-feira</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Hora de Início
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={formLoading}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Hora de Término
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={formLoading}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Disciplina
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={formLoading || subjects.length === 0}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              >
                {subjects.length === 0
                  ? <option>A carregar…</option>
                  : subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)
                }
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sala de Aula / Lab
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="ex. Sala 102, Lab A"
                disabled={formLoading}
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none transition font-semibold disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {formLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>A guardar…</span></>
              ) : (
                <span>{editingId ? 'Guardar Alterações' : 'Confirmar e Agendar'}</span>
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={formLoading}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Empty state global */}
      {!scheduleLoading && !scheduleError && schedule.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <CalendarOff size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Nenhuma aula agendada ainda</p>
            <p className="text-xs text-slate-400 mt-1">Adiciona a tua primeira aula para começares a organizar a semana.</p>
          </div>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus size={14} /><span>Adicionar Primeira Aula</span>
            </button>
          )}
        </div>
      )}

      {/* Grid semanal */}
      {!(!scheduleLoading && !scheduleError && schedule.length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {WEEKDAYS.map((dayName) => {
            const daySlots = scheduleLoading
              ? []
              : schedule.filter((s) => s.day === dayName);

            return (
              <div key={dayName} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs space-y-4 flex flex-col min-h-[400px]">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-display font-extrabold text-sm text-slate-800">{dayName}-feira</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {scheduleLoading ? '…' : `${daySlots.length} aulas`}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                  {scheduleLoading ? (
                    // Loading skeletons
                    <div className="space-y-2.5">
                      {[1, 2].map(i => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-50 animate-pulse space-y-2">
                          <div className="h-3 w-20 bg-slate-200 rounded" />
                          <div className="h-2 w-16 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : daySlots.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center py-10 text-center text-slate-300">
                      <Info size={20} className="stroke-1 mb-1.5" />
                      <p className="text-[10px] font-semibold italic">Sem aulas</p>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const subColors = subjects.find((s) => s.id === slot.subjectId);
                      return (
                        <div
                          key={slot.id}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between space-y-3 relative group transition hover:shadow-2xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: subColors?.colorHex || '#bbb' }}
                              />
                              <h4 className="font-bold text-slate-800 text-xs truncate max-w-[110px]">
                                {slot.subjectName}
                              </h4>
                            </div>

                            <div className="flex items-center text-[10px] text-slate-400 space-x-1 font-semibold">
                              <Clock size={11} />
                              <span>{slot.time}</span>
                            </div>

                            {slot.room && (
                              <div className="flex items-center text-[10px] text-slate-400 space-x-1 font-medium">
                                <MapPin size={11} />
                                <span>{slot.room}</span>
                              </div>
                            )}
                          </div>

                          {/* Acções (editar + eliminar) */}
                          <div className="absolute right-2.5 top-2 flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => startEdit(slot)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: slot.id, label: `${slot.subjectName} — ${dayName}-feira, ${slot.time}` })}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Confirmação de Eliminação ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={22} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Eliminar Aula</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tens a certeza que queres remover<br />
                <strong className="text-slate-800">"{deleteTarget.label}"</strong>?
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
