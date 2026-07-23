import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, Plus, Megaphone } from 'lucide-react';

export const NoticeBoard = ({ onOpenModalNotice }) => {
  const { notices, activeRoleId } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> COMUNICADOS OFICIALES DEL CLUB
          </div>
          <h2 className="text-2xl font-extrabold text-white">Novedades y Avisos Importantes</h2>
          <p className="text-xs text-slate-400 mt-1">Información oficial para socios, deportistas y familias</p>
        </div>

        {(activeRoleId === 'admin' || activeRoleId === 'coach') && (
          <button
            onClick={onOpenModalNotice}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Comunicado
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notices.map(notice => (
          <div 
            key={notice.id}
            className={`bg-slate-900 border rounded-2xl p-6 shadow-xl space-y-3 relative overflow-hidden ${
              notice.urgente ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {notice.urgente && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> URGENTE
                  </span>
                )}
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Destino: {notice.categoriaDestino}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{notice.fecha}</span>
            </div>

            <h3 className="font-extrabold text-white text-lg">{notice.titulo}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{notice.contenido}</p>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 font-medium flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" /> Emitido por: <strong className="text-white">{notice.autor}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
