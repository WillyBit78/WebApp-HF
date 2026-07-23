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
  const [showUploader, setShowUploader] = useState(false);

  // Socio category events
  const myEvents = events.filter(e => e.categoria === currentUser.categoria || e.categoria === 'Todas');
  
  // My payments history
  const myPayments = payments.filter(p => p.socioId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Socio Personal Card */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/20 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg">
              {currentUser.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white">{currentUser.nombre} {currentUser.apellido}</h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {currentUser.categoria}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Socio N°: <strong className="text-amber-400 font-mono">#{currentUser.numeroSocio}</strong> • {currentUser.email}
              </p>
            </div>
          </div>

          {/* Fee Status Badge */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Estado de Cuota Social</div>
              <div className="flex items-center gap-2 mt-1">
                {currentUser.estadoCuota === 'al_dia' && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AL DÍA (Julio 2026)
                  </span>
                )}
                {currentUser.estadoCuota === 'pendiente' && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4 text-amber-400" /> REVISIÓN EN CURSO
                  </span>
                )}
                {currentUser.estadoCuota === 'moroso' && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> PAGO PENDIENTE
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowUploader(!showUploader)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              <Upload className="w-4 h-4" />
              {showUploader ? 'Ocultar Formulario' : 'Subir Comprobante MP'}
            </button>
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
                <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{p.billeteraOrigen}</span>
                    <span className="text-emerald-400">${Number(p.monto).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">N° Op: {p.numeroOperacion}</div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-500">{p.fechaTransferencia}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300' :
                      p.estado === 'en_revision' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
