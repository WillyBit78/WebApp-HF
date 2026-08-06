import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, Plus, Megaphone, Trash2, Shield, Users, Clock, CheckCircle2, Filter, RotateCcw } from 'lucide-react';

export const NoticeBoard = ({ onOpenModalNotice }) => {
  const { notices, currentUser, getNoticesForUser, deleteNotice, readNoticeIds = [], toggleNoticeRead, registerPushSubscription } = useApp();

  const userRole = currentUser?.rol || 'socio';
  const canPublish = userRole === 'admin' || userRole === 'coach' || userRole === 'contador';
  const isAdmin = userRole === 'admin';

  // Filter notices depending on role
  const visibleNotices = getNoticesForUser(currentUser);

  // State for Featured Notice Modal in Foreground (Primer Plano)
  const [featuredNotice, setFeaturedNotice] = React.useState(null);

  // Detect target notice from URL hash or query string (e.g. #notices:not-123 or ?noticeId=not-123)
  React.useEffect(() => {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(window.location.search);
    const targetIdFromQuery = params.get('noticeId');
    let targetIdFromHash = '';

    if (hash.includes(':')) {
      targetIdFromHash = hash.split(':')[1];
    } else if (hash.startsWith('#not-')) {
      targetIdFromHash = hash.replace('#', '');
    }

    const targetId = targetIdFromQuery || targetIdFromHash;

    if (targetId) {
      const match = visibleNotices.find(n => n.id === targetId);
      if (match) {
        setFeaturedNotice(match);
        return;
      }
    }

    // Fallback: If opened via push notification link without ID, open latest unread notice in foreground for socio
    if ((hash.includes('notices') || params.get('tab') === 'notices') && userRole === 'socio') {
      const unreadNotices = visibleNotices.filter(n => !(readNoticeIds || []).includes(n.id));
      if (unreadNotices.length > 0) {
        setFeaturedNotice(unreadNotices[0]);
      }
    }
  }, [visibleNotices, readNoticeIds, userRole]);

  const handleCloseFeaturedNotice = (noticeToMark) => {
    if (noticeToMark && toggleNoticeRead) {
      const isRead = (readNoticeIds || []).includes(noticeToMark.id);
      if (!isRead) {
        toggleNoticeRead(noticeToMark.id);
      }
    }
    setFeaturedNotice(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 p-5 rounded-3xl shadow-2xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" /> Novedades y Avisos
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {canPublish && (
            <button
              onClick={() => onOpenModalNotice()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              <Megaphone className="w-4 h-4 shrink-0" /> Comunicado
            </button>
          )}

          {typeof window !== 'undefined' && 'Notification' in window && (
            <button
              onClick={async () => {
                const res = await registerPushSubscription(currentUser, true);
                if (res && res.success) {
                  alert('✅ ¡Alertas Push sincronizadas con éxito en este celular!');
                } else if (res && res.reason === 'denied') {
                  alert('⚠️ Las notificaciones están bloqueadas en tu navegador. Ve a Configuración > Notificaciones para permitir.');
                } else {
                  alert('🔔 Permiso concedido. Se guardará tu dispositivo para el próximo aviso.');
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial"
              title="Registrar y Vincular este celular para notificaciones Push"
            >
              <Bell className="w-4 h-4 text-amber-400 shrink-0" /> Push
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
          visibleNotices.map(notice => {
            const isRead = (readNoticeIds || []).includes(notice.id);

            return (
              <div 
                key={notice.id}
                className={`border rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden transition-all ${
                  isRead
                    ? 'bg-slate-950/60 border-slate-900 opacity-60 grayscale-[30%]'
                    : (notice.urgente 
                        ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700')
                }`}
              >
                {/* Badges Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {isRead ? (
                      <span className="bg-slate-800/80 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> LEÍDO
                      </span>
                    ) : (
                      notice.urgente && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 shadow-sm animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> URGENTE
                        </span>
                      )
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
                <div className="space-y-2 cursor-pointer group/title" onClick={() => setFeaturedNotice(notice)}>
                  <h3 className={`font-extrabold text-xl tracking-tight group-hover/title:text-purple-300 transition-colors ${isRead ? 'text-slate-400' : 'text-white'}`}>{notice.titulo}</h3>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${isRead ? 'text-slate-500' : 'text-slate-300'}`}>{notice.contenido || notice.mensaje}</p>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-purple-400" /> Emitido por: <strong className="text-white font-bold">{String(notice.autor || '').replace(/\s*\([^)]*\)/g, '')}</strong>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                      onClick={() => toggleNoticeRead && toggleNoticeRead(notice.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRead
                          ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRead ? 'Marcar como No Leído' : 'Marcar como Leído'}
                    </button>

                    {canPublish && (
                      <button
                        onClick={() => onOpenModalNotice(notice)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Reutilizar este mensaje y modificar destinatario si es necesario"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reutilizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Aviso en Primer Plano (Foreground Push Notification Modal) */}
      {featuredNotice && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Header badges */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                  <Megaphone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                    Aviso Oficial del Club
                  </h3>
                  <span className="text-[11px] text-amber-400 font-bold">📢 Novedad en Primer Plano</span>
                </div>
              </div>

              {featuredNotice.urgente && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" /> URGENTE
                </span>
              )}
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {featuredNotice.titulo}
              </h2>
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl max-h-60 overflow-y-auto">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                  {featuredNotice.contenido || featuredNotice.mensaje}
                </p>
              </div>
            </div>

            {/* Footer metadata & Entendido Action */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 font-medium">
                Emitido por <strong className="text-white">{String(featuredNotice.autor || '').replace(/\s*\([^)]*\)/g, '')}</strong> • {featuredNotice.fecha}
              </div>

              <button
                onClick={() => handleCloseFeaturedNotice(featuredNotice)}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> ¡Entendido! Marcar como Leído
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
