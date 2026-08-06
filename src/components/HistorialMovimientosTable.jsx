import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, Trash2 } from 'lucide-react';

export const HistorialMovimientosTable = ({ limit }) => {
  const { movimientosFinancieros = [], deleteMovimientoFinanciero } = useApp();
  const [filterCaja, setFilterCaja] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Format date to DD/MM/AA
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).trim();
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 4 ? parts[2].slice(-2) : parts[2];
        return `${day}/${month}/${year}`;
      }
    }
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parts[0].length === 4 ? parts[0].slice(-2) : parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].slice(0, 2).padStart(2, '0');
        return `${day}/${month}/${year}`;
      }
    }
    return cleanStr;
  };

  // Get short staff name (first name only)
  const getShortStaffName = (responsable) => {
    if (!responsable) return 'Staff';
    const clean = String(responsable).replace(/\(.*\)/g, '').trim();
    return clean.split(' ')[0] || 'Staff';
  };

  const filteredMovimientos = movimientosFinancieros.filter(m => {
    if (filterCaja !== 'todas' && m.caja !== filterCaja) return false;
    if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false;
    return true;
  });

  const displayList = limit ? filteredMovimientos.slice(0, limit) : filteredMovimientos;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          Historial de Movimientos
        </h3>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={filterCaja}
            onChange={(e) => setFilterCaja(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-medium outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todas">Todas las Cajas</option>
            <option value="cuotas">Cuotas (C)</option>
            <option value="torneos">Torneos (T)</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-medium outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos (+)</option>
            <option value="gasto">Gastos (-)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-2 text-slate-400">Fecha</th>
              <th className="py-2.5 px-2 text-center">Caja</th>
              <th className="py-2.5 px-2 text-right">Monto</th>
              <th className="py-2.5 px-2">Concepto</th>
              <th className="py-2.5 px-2">Staff</th>
              <th className="py-2.5 px-1 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-500 text-xs italic">
                  No hay movimientos contables registrados.
                </td>
              </tr>
            ) : (
              displayList.map((m) => {
                const isIngreso = m.tipo === 'ingreso';
                const isCuotas = m.caja === 'cuotas';

                return (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition-colors text-[11px] sm:text-xs">
                    {/* FECHA DD/MM/AA */}
                    <td className="py-2 px-2 text-slate-400 font-mono whitespace-nowrap">
                      {formatDateShort(m.fecha)}
                    </td>

                    {/* CAJA INICIAL C o T */}
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-5 h-5 rounded-md leading-5 text-[10px] font-black uppercase text-center ${
                        isCuotas 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`} title={isCuotas ? 'Caja Cuotas' : 'Caja Torneos'}>
                        {isCuotas ? 'C' : 'T'}
                      </span>
                    </td>

                    {/* MONTO */}
                    <td className={`py-2 px-2 text-right font-black whitespace-nowrap ${
                      isIngreso ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isIngreso ? '+' : '-'}${Number(m.monto || 0).toLocaleString('es-AR')}
                    </td>

                    {/* CONCEPTO */}
                    <td className="py-2 px-2 font-medium text-white max-w-[140px] sm:max-w-[200px] truncate" title={m.concepto}>
                      {m.concepto}
                    </td>

                    {/* STAFF */}
                    <td className="py-2 px-2 font-bold text-amber-300 whitespace-nowrap">
                      {getShortStaffName(m.responsable)}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-2 px-1 text-right">
                      {typeof deleteMovimientoFinanciero === 'function' && (
                        <button 
                          onClick={() => deleteMovimientoFinanciero(m.id)}
                          className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
