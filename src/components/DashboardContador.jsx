import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  ArrowUpRight, 
  FileCheck, 
  Sparkles,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';

export const DashboardContador = () => {
  const { payments, updatePaymentStatus, stats, clubSettings } = useApp();
  const [filterStatus, setFilterStatus] = useState('en_revision'); // en_revision, todos, aprobado, rechazado
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filteredPayments = payments.filter(p => {
    if (filterStatus === 'todos') return true;
    return p.estado === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Finance Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/20 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" /> SECTOR FINANZAS Y CONTABILIDAD
          </div>
          <h2 className="text-2xl font-extrabold text-white">Auditoría de Pagos y Transferencias</h2>
          <p className="text-xs text-slate-400 mt-1">
            Conciliación en tiempo real de comprobantes transferidos a Mercado Pago (<strong>{clubSettings.aliasMercadoPago}</strong>)
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Recaudado Auditado</div>
            <div className="text-2xl font-black text-emerald-400">${stats.totalRecaudado.toLocaleString('es-AR')}</div>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Pendientes de Revisar</div>
            <div className="text-xl font-bold text-amber-400">{stats.pagosPendientesRev.length} pagos</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: 'en_revision', label: `Pendientes de Revisión (${stats.pagosPendientesRev.length})` },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'rechazado', label: 'Rechazados' },
            { id: 'todos', label: 'Historial Completo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Receipts Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPayments.length === 0 ? (
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="font-bold text-white">No hay comprobantes en esta sección</div>
            <p className="text-xs text-slate-500 mt-1">Todos los comprobantes reportados han sido procesados.</p>
          </div>
        ) : (
          filteredPayments.map(p => (
            <div 
              key={p.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden ${
                p.estado === 'en_revision' ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {p.billeteraOrigen} • N° {p.numeroOperacion}
                  </div>
                  <div className="font-extrabold text-base text-white mt-0.5">{p.socioNombre}</div>
                  <div className="text-[11px] text-slate-400">Emisor: {p.emisorNombre}</div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-400">${Number(p.monto).toLocaleString('es-AR')}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    p.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    p.estado === 'en_revision' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {p.estado === 'aprobado' ? 'Aprobado' : p.estado === 'en_revision' ? 'Pendiente' : 'Rechazado'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs mb-4">
                <div className="text-slate-400 text-[10px]">Fecha de Transferencia: {p.fechaTransferencia}</div>
                <div className="text-slate-200 mt-1 font-medium italic">"{p.observaciones}"</div>
              </div>

              {/* Action Buttons for Contador */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedReceipt(p.comprobanteUrl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver Captura
                </button>

                {p.estado === 'en_revision' && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => updatePaymentStatus(p.id, 'rechazado', 'N° de Operación no encontrado en Mercado Pago')}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>

                    <button
                      onClick={() => updatePaymentStatus(p.id, 'aprobado', 'Verificado y acreditado en Mercado Pago')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar y Acreditar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal Preview */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-sm">Vista Previa de Comprobante</h4>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={selectedReceipt} alt="Comprobante" className="w-full h-80 object-cover rounded-xl border border-slate-800" />
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
