import React from 'react';
import { CalendarDays, Trophy, MapPin, Clock } from 'lucide-react';

export const CalendarModule = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative max-w-lg w-full mx-auto text-center space-y-6 p-10">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl space-y-6">
          {/* Animated icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-5xl" role="img" aria-label="calendario de partidos">⚽</span>
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
              <CalendarDays className="w-4 h-4 text-slate-900" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Próximamente
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full mx-auto"></div>
          </div>

          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Toda la información de los <strong className="text-amber-300">partidos</strong>, <strong className="text-emerald-300">horarios de entrenamiento</strong> y <strong className="text-blue-300">sedes</strong> del club estará disponible aquí.
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
              <span className="text-[10px] text-slate-500 font-semibold block">Partidos</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <Clock className="w-5 h-5 text-emerald-400 mx-auto" />
              <span className="text-[10px] text-slate-500 font-semibold block">Horarios</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <MapPin className="w-5 h-5 text-blue-400 mx-auto" />
              <span className="text-[10px] text-slate-500 font-semibold block">Sedes</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            Haedo Futsal · Calendario Oficial
          </p>
        </div>
      </div>
    </div>
  );
};
