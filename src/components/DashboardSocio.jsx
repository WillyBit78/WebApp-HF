import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentUploader } from './PaymentUploader';
import { getPeriodString, isLastDayOfMonth } from '../utils/dateUtils';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Bell, 
  Trophy, 
  Upload, 
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const DashboardSocio = () => {
  const { currentUser, events, notices, payments, clubSettings, getNoticesForUser } = useApp();
  const [showUploader, setShowUploader] = useState(() => {
    const isShared = new URLSearchParams(window.location.search).get('shared') === 'true';
    return isShared;
  });

  // Auto-abrir uploader si hay un comprobante compartido desde celular pendiente en la caché
  React.useEffect(() => {
    const checkPendingShare = async () => {
      try {
        const isSharedParam = new URLSearchParams(window.location.search).get('shared') === 'true';
        let hasCacheFile = false;
        if ('caches' in window) {
          const cache = await caches.open('shared-receipts');
          const matched = await cache.match('/shared-receipt-file') || await cache.match('/shared-receipt.jpg');
          if (matched) hasCacheFile = true;
        }
        if (isSharedParam || hasCacheFile) {
          setShowUploader(true);
        }
      } catch (err) {
        console.warn("Error verificando caché compartida:", err);
      }
    };
    checkPendingShare();
  }, []);

  // Socio targeted notices
  const myNotices = getNoticesForUser ? getNoticesForUser(currentUser) : notices;
  const urgentNotice = myNotices.find(n => n.urgente);

  // Socio category events
  const myEvents = events.filter(e => e.categoria === currentUser.categoria || e.categoria === 'Todas');
    // My payments history
  const myPayments = payments.filter(p => p.socioId === currentUser.id || String(p.numeroSocio) === String(currentUser.numeroSocio));

  // Dynamic fee status calculation for active period (Agosto 2026)
  const activePeriod = getPeriodString();
  const myActivePeriodPayments = myPayments.filter(p => {
    if (p.periodo) return p.periodo === activePeriod;
    return getPeriodString(p.fechaTransferencia || p.fecha || p.created_at) === activePeriod;
  });

  const hasApprovedPayment = myActivePeriodPayments.some(p => p.estado === 'aprobado');
  const hasPendingRevision = myActivePeriodPayments.some(p => p.estado === 'en_revision');
  
  const effectiveFeeStatus = hasApprovedPayment 
    ? 'al_dia' 
    : (hasPendingRevision ? 'en_revision' : 'pendiente');

  return (
    <div className="space-y-6">
      



      {/* Socio Personal Card - Centered & Responsive */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-6 rounded-3xl shadow-2xl text-center flex flex-col items-center justify-center space-y-4">
        
        {/* Avatar / Foto */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 p-1 flex items-center justify-center text-amber-400 font-black text-3xl shadow-xl overflow-hidden">
          {currentUser.fotoUrl || currentUser.foto ? (
            <img src={currentUser.fotoUrl || currentUser.foto} alt={currentUser.nombre} className="w-full h-full object-cover rounded-xl" />
          ) : (
            currentUser.nombre.charAt(0).toUpperCase()
          )}
        </div>

        {/* Nombre, Disciplina, Usuario */}
        <div className="space-y-1 max-w-md w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {currentUser.nombre} {currentUser.apellido}
          </h2>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide">
              {currentUser.categoria || 'Sin Categoría'}
            </span>
          </div>

          <p className="text-xs text-slate-400 pt-1 font-mono">
            Usuario: <strong className="text-amber-400">@{currentUser.usuario || 'socio'}</strong>
          </p>
        </div>

        {/* 4 Cuotas Mensuales del Socio */}
        <div className="w-full space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-400" /> Cuotas Mensuales Social ({currentUser.categoria || 'General'})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Precio: <strong className="text-emerald-400">${(currentUser.montoCuota || 15000).toLocaleString('es-AR')}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {(() => {
              const now = new Date();
              const currentMonthIndex = now.getMonth();
              const currentYear = now.getFullYear();
              const isLastDay = isLastDayOfMonth(now);

              const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

              const getMonthInfo = (offset) => {
                const date = new Date(currentYear, currentMonthIndex + offset, 1);
                return {
                  name: monthNames[date.getMonth()],
                  year: date.getFullYear(),
                  period: getPeriodString(date),
                  offset
                };
              };

              const months = [
                getMonthInfo(-1), // Mes Anterior
                getMonthInfo(0),  // Mes Actual (En Curso)
                getMonthInfo(1),  // Mes Siguiente (+1)
                getMonthInfo(2)   // Mes Sub-siguiente (+2)
              ];

              return months.map((m, idx) => {
                const isPrevious = m.offset === -1;
                const isCurrent = m.offset === 0;
                const isNext = m.offset === 1;

                // Estado de pagos para este mes específico
                const isCurrentPaid = effectiveFeeStatus === 'al_dia';
                
                // Regla del mes siguiente: Se habilita si es el último día del mes O si la cuota del mes actual ya fue ABONADA (Al Día)
                const isNextUnlocked = isNext && (isLastDay || isCurrentPaid);

                if (isPrevious) {
                  return (
                    <div key={idx} className="bg-slate-950/80 border border-emerald-500/40 p-4 rounded-2xl space-y-2 opacity-90 relative">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>{m.name} {m.year}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[9px]">Anterior</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> PAGADO
                      </div>
                      <div className="text-[10px] text-slate-400">Cuota anterior al día.</div>
                    </div>
                  );
                }

                if (isCurrent) {
                  return (
                    <div key={idx} className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 p-4 rounded-2xl space-y-2 shadow-lg relative">
                      <div className="flex justify-between items-center text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        <span>{m.name} {m.year}</span>
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full text-[9px] font-extrabold">En Curso</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-extrabold text-sm">
                        {effectiveFeeStatus === 'al_dia' && <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AL DÍA</>}
                        {effectiveFeeStatus === 'en_revision' && <><Clock className="w-4 h-4 text-amber-400 animate-pulse" /> EN REVISIÓN</>}
                        {effectiveFeeStatus === 'pendiente' && <><AlertTriangle className="w-4 h-4 text-rose-400" /> PENDIENTE</>}
                      </div>
                      {effectiveFeeStatus !== 'al_dia' && (
                        <button
                          type="button"
                          onClick={() => setShowUploader(!showUploader)}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {showUploader ? 'Ocultar Formulario' : 'Subir Comprobante MP'}
                        </button>
                      )}
                      {effectiveFeeStatus === 'al_dia' && (
                        <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                          Cuota de {m.name} abonada correctamente.
                        </div>
                      )}
                    </div>
                  );
                }

                if (isNext) {
                  if (isNextUnlocked) {
                    return (
                      <div key={idx} className="bg-slate-900 border border-amber-500/40 p-4 rounded-2xl space-y-2 shadow-md">
                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          <span>{m.name} {m.year}</span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[9px]">Habilitado</span>
                        </div>
                        <div className="text-white font-bold text-sm">Cuota Siguiente</div>
                        <button
                          type="button"
                          onClick={() => setShowUploader(!showUploader)}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> Adelantar Pago
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-2 opacity-50 select-none grayscale pointer-events-none">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{m.name} {m.year}</span>
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[9px]">Próximo</span>
                      </div>
                      <div className="text-slate-400 font-medium text-xs">Cuota Próxima</div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {isCurrentPaid ? 'Se activará el último día del mes.' : 'Se habilita el último día del mes o al abonar la cuota actual.'}
                      </div>
                    </div>
                  );
                }

                // Far next (+2 Septiembre)
                return (
                  <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-2 opacity-40 select-none grayscale pointer-events-none">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <span>{m.name} {m.year}</span>
                      <span className="bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px]">Grisado</span>
                    </div>
                    <div className="text-slate-500 font-medium text-xs">Futura Cuota</div>
                    <div className="text-[10px] text-slate-600 leading-tight">Inactiva hasta el período correspondiente.</div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

      </div>

      {/* Payment Receipt Uploader Inline */}
      {showUploader && (
        <PaymentUploader onSuccess={() => setShowUploader(false)} />
      )}

      {/* Grid Layout: Agenda & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Agenda */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Agenda y Partidos de tu Categoría ({currentUser.categoria})
          </h3>

          <div className="space-y-3">
            {myEvents.map(evt => (
              <div 
                key={evt.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    evt.tipo === 'partido' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {evt.tipo}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{evt.fecha}</span>
                </div>

                <div className="font-bold text-white text-base">{evt.titulo}</div>
                <div className="text-slate-300">📍 Lugar: <strong>{evt.lugar}</strong></div>
                {evt.detalles && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-amber-300/90 text-xs">
                    📢 {evt.detalles}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* My Payment History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Mis Comprobantes Subidos
          </h3>

          <div className="space-y-3">
            {myPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No has registrado comprobantes aún.</p>
            ) : (
              myPayments.map(p => (
                <div key={p.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-white">
                    <span>{p.billeteraOrigen}</span>
                    <span className="text-emerald-400">${Number(p.monto).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">N° Op: {p.numeroOperacion}</div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-500">{p.fechaTransferencia}</span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      p.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      p.estado === 'en_revision' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                  {p.observaciones && p.estado !== 'aprobado' && (
                    <div className={`mt-2 p-2 rounded-lg text-[11px] font-medium leading-tight flex items-start gap-1.5 ${
                      p.estado === 'rechazado' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                    }`}>
                      <span>
                        {p.estado === 'rechazado'
                          ? `⚠️ Reacción requerida: ${p.observaciones.includes('duplicado') ? 'Comprobante duplicado o ya registrado.' : 'Comprobante rechazado por administración.'}`
                          : '⏳ Comprobante recibido. En proceso de verificación por Administración.'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
