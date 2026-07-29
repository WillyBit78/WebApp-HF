import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, Plus, Megaphone, Trash2, Shield, Users, Clock, CheckCircle2, Filter, RotateCcw } from 'lucide-react';

export const NoticeBoard = ({ onOpenModalNotice }) => {
  const { notices, currentUser, getNoticesForUser, deleteNotice } = useApp();

  const userRole = currentUser?.rol || 'socio';
  const canPublish = userRole === 'admin' || userRole === 'coach' || userRole === 'contador';
  const isAdmin = userRole === 'admin';

  // Filter notices depending on role
  const visibleNotices = getNoticesForUser(currentUser);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" /> COMUNICADOS Y NOTIFICACIONES OFICIALES
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Novedades y Avisos del Club</h2>
          <p className="text-xs text-slate-400 mt-1">Información oficial para socios, deportistas, contadores y cuerpo técnico</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canPublish && (
            <button
              onClick={() => onOpenModalNotice()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
            >
              <Megaphone className="w-4.5 h-4.5" /> Enviar Comunicado Masivo
            </button>
          )}

          {typeof window !== 'undefined' && 'Notification' in window && (
            <button
              onClick={async () => {
                if (Notification.permission === 'granted') {
                  alert('🔔 Las notificaciones Push ya están activadas en este dispositivo.');
                } else {
                  const p = await Notification.requestPermission();
                  if (p === 'granted') alert('✅ Notificaciones Push activadas con éxito.');
                  else alert('⚠️ Para recibir avisos con la app cerrada, debes habilitar las notificaciones en la configuración del navegador.');
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold px-3 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Verificar Notificaciones Push en este celular"
            >
              <Bell className="w-4 h-4 text-amber-400" /> Alertas Push
            </button>
          )}
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {visibleNotices.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-2">
            <Bell className="w-10 h-10 text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-300">No hay avisos ni comunicados vigentes</h3>
            <p className="text-xs text-slate-500">Aquí aparecerán todas las novedades dirigidas a tu categoría o disciplina.</p>
          </div>
        ) : (
          visibleNotices.map(notice => (
            <div 
              key={notice.id}
              className={`bg-slate-900 border rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden transition-all ${
                notice.urgente 
                  ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badges Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {notice.urgente && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 shadow-sm animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> URGENTE
                    </span>
                  )}

                  <span className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> 
                    Destino: {notice.destinatarioValor || notice.categoriaDestino || 'Todos los Socios'}
                  </span>

                  {notice.filtroEstadoCuenta === 'al_dia' && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      🟢 Solo Socios Al Día
                    </span>
                  )}

                  {notice.filtroEstadoCuenta === 'pendiente' && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      🔴 Solo Socios Pendientes
                    </span>
                  )}

                  {notice.fechaProgramada && (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" /> Programado: {notice.fechaProgramada}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono font-semibold">{notice.fecha}</span>
                  {canPublish && (
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este comunicado de forma permanente?')) {
                          deleteNotice(notice.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar aviso permanente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-white text-xl tracking-tight">{notice.titulo}</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{notice.contenido || notice.mensaje}</p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-purple-400" /> Emitido por: <strong className="text-white font-bold">{notice.autor}</strong>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {canPublish && (
                    <button
                      onClick={() => onOpenModalNotice(notice)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Reutilizar este mensaje y modificar destinatario si es necesario"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reutilizar Aviso
                    </button>
                  )}

                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Push Transmitido
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
