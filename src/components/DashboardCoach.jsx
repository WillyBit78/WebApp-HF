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

export const DashboardCoach = ({ onOpenModalUser, onOpenModalEvent, onOpenModalNotice }) => {
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
      {/* Coach Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/20 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" /> SECTOR CUERPO TÉCNICO Y DEPORTES
          </div>
          <h2 className="text-2xl font-extrabold text-white">Gestión de Planteles y Convocatorias</h2>
          <p className="text-xs text-slate-400 mt-1">
            DT Activo: <strong>{currentUser?.nombre} {currentUser?.apellido}</strong> (Categoría {currentUser?.categoria})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenModalUser}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Alta Socio
          </button>
          <button
            onClick={handleCopyLink}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" /> {copiedLink ? '¡Link Copiado!' : 'Copiar Link Inscripción'}
          </button>
          <button
            onClick={onOpenModalEvent}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Crear Partido / Práctica
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Categoría:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dashboard de Socios Jerárquico */}
      <DashboardSocios onOpenModalUser={onOpenModalUser} />

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
