import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardSocios } from './DashboardSocios';
import { 
  UserCheck, 
  Plus, 
  Calendar, 
  Bell, 
  Trophy, 
  Users, 
  CheckCircle, 
  Clock, 
  Megaphone,
  Filter,
  Trash2,
  Banknote,
  ShieldCheck,
  CheckCheck,
  Share2,
  Copy
} from 'lucide-react';
import { MainDashboardSummary } from './MainDashboardSummary';

export const DashboardCoach = ({ onNavigate, onOpenModalUser, onOpenModalEvent, onOpenModalNotice }) => {
  const { users, events, notices, currentUser, deleteUser, registrarPagoEfectivoCoach, openFichaSocio } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#registro';
    const shareText = `Haedo Futsal App\nInscribite en la App Oficial del Club!\n${url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Cash payment modal state
  const [cashModalSocio, setCashModalSocio] = useState(null);
  const [cashMonto, setCashMonto] = useState(15000);
  const [cashConcepto, setCashConcepto] = useState('Pago de cuota social en efectivo al DT');

  const categories = [
    'Todas', 
    'BAFI Femenino', 
    'EDEFI Mayores', 
    'EDEFI Baby', 
    'FUTSALA Promo', 
    'FUTSALA Masculino', 
    'BAFI Masculino'
  ];

  const handleConfirmCashPayment = (e) => {
    e.preventDefault();
    if (!cashModalSocio) return;

    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto);
    setCashModalSocio(null);
  };

  const filteredUsers = users.filter(u => {
    if (selectedCategory === 'Todas') return true;
    return u.categoria && u.categoria.includes(selectedCategory);
  });

  const filteredEvents = events.filter(e => {
    if (selectedCategory === 'Todas') return true;
    return e.categoria && (e.categoria.includes(selectedCategory) || e.categoria === 'Todas');
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Resumen 3D Interactivo para Staff */}
      <MainDashboardSummary onNavigate={onNavigate} />

      {/* Modal Cobro en Efectivo por Coach */}
      {cashModalSocio && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Registrar Cobro en Efectivo
              </h3>
              <button onClick={() => setCashModalSocio(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Jugador / Socio:</div>
                <div className="font-extrabold text-white text-base mt-0.5">{cashModalSocio.nombre} {cashModalSocio.apellido}</div>
                <div className="text-[11px] text-amber-400 font-mono">N° Socio: #{cashModalSocio.numeroSocio} • Categoría: {cashModalSocio.categoria}</div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-slate-300 space-y-1">
                <div className="font-bold text-blue-300">Responsable que recibe y custodia el dinero:</div>
                <div className="text-white font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {currentUser.nombre} {currentUser.apellido} (COACH - DT)
                </div>
                <p className="text-[10px] text-slate-400">
                  El dinero ingresa a la Caja de Cuotas y queda auditado a tu nombre hasta ser entregado a tesorería.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Monto Recibido ($)</label>
                <input
                  type="number"
                  required
                  value={cashMonto}
                  onChange={(e) => setCashMonto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Concepto / Detalle</label>
                <input
                  type="text"
                  required
                  value={cashConcepto}
                  onChange={(e) => setCashConcepto(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModalSocio(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
