import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentUploader } from './PaymentUploader';
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
  const { currentUser, events, notices, payments, clubSettings } = useApp();
  const [showUploader, setShowUploader] = useState(() => {
    const isShared = new URLSearchParams(window.location.search).get('shared') === 'true';
    return isShared;
  });

  // Socio category events
  const myEvents = events.filter(e => e.categoria === currentUser.categoria || e.categoria === 'Todas');
  
  // My payments history
  const myPayments = payments.filter(p => p.socioId === currentUser.id);

  // Dynamic fee status calculation: if socio has ANY approved payment, they are AL DIA!
  const hasApprovedPayment = myPayments.some(p => p.estado === 'aprobado');
  const hasPendingRevision = myPayments.some(p => p.estado === 'en_revision');
  
  const effectiveFeeStatus = hasApprovedPayment 
    ? 'al_dia' 
    : (hasPendingRevision ? 'pendiente' : (currentUser.estadoCuota || 'moroso'));

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

        {/* Fee Status Badge & Subir Comprobante Button */}
        <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-lg shadow-inner">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cuota Social - Junio 2026</div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {effectiveFeeStatus === 'al_dia' && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AL DÍA (Junio 2026)
                </span>
              )}
              {effectiveFeeStatus === 'pendiente' && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-4 h-4 text-amber-400" /> REVISIÓN EN CURSO
                </span>
              )}
              {effectiveFeeStatus === 'moroso' && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> JUNIO 2026 - PAGO PENDIENTE
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowUploader(!showUploader)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {showUploader ? 'Ocultar Formulario' : 'Subir Comprobante MP'}
          </button>
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
                      <span>⚠️ Motivo: {p.observaciones}</span>
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
