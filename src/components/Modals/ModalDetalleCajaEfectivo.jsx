import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Wallet, Banknote, Building2, User, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

export const ModalDetalleCajaEfectivo = ({ cajaTitle = 'Caja General', cajaType = 'todas', onClose }) => {
  const { movimientosFinancieros = [], payments = [], users = [] } = useApp();
  const [showStaffDetail, setShowStaffDetail] = useState(true);

  // Filter movements for this caja
  const movs = movimientosFinancieros.filter(m => cajaType === 'todas' || m.caja === cajaType);
  const pms = cajaType === 'torneos' ? [] : payments.filter(p => p.estado === 'aprobado');

  let enCuentaIngresos = 0;
  let enCuentaGastos = 0;
  let efectivoIngresos = 0;
  let efectivoGastos = 0;

  // Payments (Transfer / MP)
  pms.forEach(p => {
    if (p.billeteraOrigen === 'Efectivo') {
      efectivoIngresos += Number(p.monto || 0);
    } else {
      enCuentaIngresos += Number(p.monto || 0);
    }
  });

  // Movimientos
  movs.forEach(m => {
    const isEfectivo = !m.billeteraOrigen || m.billeteraOrigen === 'Efectivo' || m.metodoPago === 'efectivo' || Boolean(m.responsable);
    const monto = Number(m.monto || 0);
    if (m.tipo === 'ingreso') {
      if (isEfectivo) efectivoIngresos += monto;
      else enCuentaIngresos += monto;
    } else {
      if (isEfectivo) efectivoGastos += monto;
      else enCuentaGastos += monto;
    }
  });

  const enCuentaSaldo = enCuentaIngresos - enCuentaGastos;
  const efectivoSaldo = efectivoIngresos - efectivoGastos;
  const saldoTotal = enCuentaSaldo + efectivoSaldo;

  // Calculate per-staff cash holdings
  const staffCashMap = {};

  movs.forEach(m => {
    const isEfectivo = !m.billeteraOrigen || m.billeteraOrigen === 'Efectivo' || m.metodoPago === 'efectivo' || Boolean(m.responsable);
    if (isEfectivo) {
      const rawName = m.responsable ? m.responsable.replace(/\(.*\)/g, '').trim() : 'Administración';
      const firstName = rawName.split(' ')[0] || 'Staff';
      if (!staffCashMap[firstName]) staffCashMap[firstName] = { ingresos: 0, gastos: 0, saldo: 0, fullName: rawName };
      const monto = Number(m.monto || 0);
      if (m.tipo === 'ingreso') {
        staffCashMap[firstName].ingresos += monto;
        staffCashMap[firstName].saldo += monto;
      } else {
        staffCashMap[firstName].gastos += monto;
        staffCashMap[firstName].saldo -= monto;
      }
    }
  });

  pms.forEach(p => {
    if (p.billeteraOrigen === 'Efectivo') {
      const rawName = p.observaciones?.includes('DT') ? p.observaciones.split('DT')[1]?.trim() : 'Administración';
      const firstName = rawName.split(' ')[0] || 'Staff';
      if (!staffCashMap[firstName]) staffCashMap[firstName] = { ingresos: 0, gastos: 0, saldo: 0, fullName: rawName };
      const monto = Number(p.monto || 0);
      staffCashMap[firstName].ingresos += monto;
      staffCashMap[firstName].saldo += monto;
    }
  });

  const staffList = Object.keys(staffCashMap).map(k => ({
    name: k,
    ...staffCashMap[k]
  }));

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                Desglose: {cajaTitle}
              </h3>
              <span className="text-[11px] text-slate-400">Fondos en Cuenta vs Efectivo en mano</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance General Result Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Saldo Total Neto</span>
            <div className={`text-2xl font-black ${saldoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${saldoTotal.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-emerald-400 font-bold block">+ Ingresos: ${(enCuentaIngresos + efectivoIngresos).toLocaleString('es-AR')}</span>
            <span className="text-rose-400 font-bold block">- Gastos: ${(enCuentaGastos + efectivoGastos).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* 2 Main Distribution Boxes: En Cuenta MP vs En Efectivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* EN CUENTA BANCARIA / MP */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> En Cuenta MP
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">Banco</span>
            </div>
            <div className="text-xl font-black text-white">
              ${enCuentaSaldo.toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
              <span>Ing: +${enCuentaIngresos.toLocaleString('es-AR')}</span>
              <span>Gas: -${enCuentaGastos.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* EN EFECTIVO */}
          <div 
            onClick={() => setShowStaffDetail(!showStaffDetail)}
            className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 hover:border-amber-400 space-y-2 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <Banknote className="w-4 h-4" /> En Efectivo
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Físico {showStaffDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            </div>
            <div className="text-xl font-black text-amber-300 group-hover:text-amber-200">
              ${efectivoSaldo.toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
              <span>Ing: +${efectivoIngresos.toLocaleString('es-AR')}</span>
              <span>Gas: -${efectivoGastos.toLocaleString('es-AR')}</span>
            </div>
          </div>

        </div>

        {/* Per-Staff Cash Holdings Detail */}
        {showStaffDetail && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-3.5 h-3.5" /> Efectivo en Custodia por Integrante (Staff)
            </h4>

            {staffList.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-2">
                No hay efectivo registrado en custodia del staff.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {staffList.map((st) => (
                  <div key={st.name} className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        {st.fullName || st.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Ingresos: +${st.ingresos.toLocaleString('es-AR')} • Gastos: -${st.gastos.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-sm ${st.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${st.saldo.toLocaleString('es-AR')}
                      </div>
                      <span className="text-[9px] text-slate-500 font-semibold uppercase">En mano</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-center">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            Cerrar Desglose
          </button>
        </div>

      </div>
    </div>
  );
};
