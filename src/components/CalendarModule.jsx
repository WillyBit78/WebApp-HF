import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Filter, MapPin, Trophy, Plus, Clock } from 'lucide-react';

export const CalendarModule = ({ onOpenModalEvent }) => {
  const { events, activeRoleId } = useApp();
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterType, setFilterType] = useState('todos'); // todos, partido, entrenamiento

  const categories = ['Todas', 'Sub-13', 'Sub-15', 'Sub-17', 'Reserva', 'Primera', 'Femenino', 'Senior'];

  const filteredEvents = events.filter(e => {
    const matchCat = filterCategory === 'Todas' || e.categoria === filterCategory || e.categoria === 'Todas';
    const matchType = filterType === 'todos' || e.tipo === filterType;
    return matchCat && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" /> CALENDARIO OFICIAL DE FUTSAL
          </div>
          <h2 className="text-2xl font-extrabold text-white">Partidos y Horarios de Entrenamiento</h2>
          <p className="text-xs text-slate-400 mt-1">Cronograma de todas las categorías de Haedo Futsal</p>
        </div>

        {(activeRoleId === 'admin' || activeRoleId === 'coach') && (
          <button
            onClick={onOpenModalEvent}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-500/20"
          >
            <Plus className="w-4 h-4" /> Programar Partido / Práctica
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Categoría:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/10'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['todos', 'partido', 'entrenamiento'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                filterType === type ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map(evt => (
          <div 
            key={evt.id}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                evt.tipo === 'partido' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {evt.tipo} • {evt.categoria}
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {evt.fecha}
              </span>
            </div>

            <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
              {evt.titulo}
            </h3>

            <div className="text-xs text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{evt.lugar}</span>
            </div>

            {evt.detalles && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                {evt.detalles}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
