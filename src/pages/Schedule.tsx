/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

const TIME_PRESETS = [
  '08:15 - 09:45',
  '10:00 - 11:30',
  '11:45 - 13:15',
  '14:30 - 16:00',
  '16:15 - 17:45'
];

export const Schedule: React.FC = () => {
  const { schedule, subjects, addScheduleSlot, removeScheduleSlot } = useApp();

  // Form states for adding slot
  const [day, setDay] = useState('Segunda');
  const [time, setTime] = useState('08:15 - 09:45');
  const [subjectId, setSubjectId] = useState('matematica');
  const [room, setRoom] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    addScheduleSlot({
      day,
      time,
      subjectId,
      subjectName: sub.name,
      room: room || undefined
    });

    setRoom('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Horário Escolar Weekly</h1>
          <p className="text-sm text-slate-500 mt-1">Desenha e organiza a tua agenda semanal escolar de aulas e salas de estudo.</p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>{formOpen ? 'Fechar Editor' : 'Adicionar Aula'}</span>
        </button>
      </div>

      {/* Slide inline form for adding classes */}
      {formOpen && (
        <form
          onSubmit={handleAddSlot}
          className="bg-white p-5 rounded-2xl border border-blue-200/60 shadow-md space-y-4 animate-fade-in"
        >
          <h3 className="font-display font-bold text-sm text-slate-800 flex items-center">
            <Sparkles size={16} className="text-blue-500 mr-2" /> Adicionar Turno Escolar
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-405 text-slate-400 uppercase tracking-wider mb-1.5">
                Dia da Semana
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}-feira
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Horário da Aula
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition"
              >
                {TIME_PRESETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Disciplina
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="block w-full text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
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
                className="block w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none transition font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Confirmar e Agendar
          </button>
        </form>
      )}

      {/* Calendar Grid - Mon to Fri Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {WEEKDAYS.map((dayName) => {
          // get slots for this specific day
          const daySlots = schedule
            .filter((s) => s.day === dayName)
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={dayName} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs space-y-4 flex flex-col min-h-[400px]">
              {/* Day title info */}
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-extrabold text-sm text-slate-800">{dayName}-feira</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                  {daySlots.length} aulas
                </span>
              </div>

              {/* Day Slot lists */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
                {daySlots.length === 0 ? (
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
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: subColors?.colorHex || '#bbb' }}
                            ></div>
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

                        {/* Delete lesson */}
                        <button
                          onClick={() => removeScheduleSlot(slot.id)}
                          className="absolute right-2.5 top-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto p-1 text-slate-405 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
