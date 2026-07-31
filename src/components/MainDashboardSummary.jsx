import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wallet, 
  Users, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  ShieldCheck 
} from 'lucide-react';

export const MainDashboardSummary = ({ onNavigate }) => {
  const { 
    users = [], 
    payments = [], 
    movimientosFinancieros = [], 
    stats = {}, 
    openAuditoriaStatus,
    setAuditoriaFilterStatus
  } = useApp();

  // 1. Filtrar solo usuarios con rol de socio
  const socios = users.filter(u => (!u.rol || u.rol === 'socio'));
  const totalSocios = socios.length;
  const sociosAlDia = socios.filter(s => s.estadoCuota === 'al_dia').length;
  const sociosPendientes = totalSocios - sociosAlDia;
  const pctAlDia = totalSocios > 0 ? Math.round((sociosAlDia / totalSocios) * 100) : 0;
  const pctPendiente = totalSocios > 0 ? 100 - pctAlDia : 0;

  // 2. Cálculo de Finanzas del Mes Actual
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  // Ingresos del mes (Cuotas Aprobadas + Movimientos Ingreso)
  const pagosAprobadosMes = payments.filter(p => p.estado === 'aprobado' && isCurrentMonth(p.fecha || p.created_at));
  const totalPagosMes = pagosAprobadosMes.reduce((sum, p) => sum + Number(p.monto || 0), 0);

  const movIngresosMes = movimientosFinancieros.filter(m => m.tipo === 'ingreso' && isCurrentMonth(m.fecha));
  const totalMovIngresosMes = movIngresosMes.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const ingresosMesTotal = totalPagosMes + totalMovIngresosMes;

  // Egresos / Gastos del mes
  const movGastosMes = movimientosFinancieros.filter(m => m.tipo === 'gasto' && isCurrentMonth(m.fecha));
  const gastosMesTotal = movGastosMes.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const balanceMesNeto = ingresosMesTotal - gastosMesTotal;

  // 3. Comprobantes pendientes de revisión
  const comprobantesPendientes = payments.filter(p => p.estado === 'en_revision');
  const totalPendientesCount = comprobantesPendientes.length;

  // SVG Donut calculation
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.19
  const strokeDashoffset = circumference - (pctAlDia / 100) * circumference;

  const handleGoToFinance = () => {
    if (onNavigate) onNavigate('finance');
  };

  const handleGoToSocios = () => {
    if (onNavigate) onNavigate('users');
  };

  const handleGoToAuditoria = () => {
    if (openAuditoriaStatus) {
      openAuditoriaStatus('en_revision');
    } else if (setAuditoriaFilterStatus) {
      setAuditoriaFilterStatus('en_revision');
    }
    if (onNavigate) onNavigate('finance');
  };

  return (
    <div className="space-y-6">
      {/* Grid de 4 Tarjetas Dashboard Moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: SECTOR FINANZAS - BALANCE DEL MES */}
        <div 
          onClick={handleGoToFinance}
          className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-3xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Sector Finanzas
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Balance Neto del Mes</h4>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <div className={`text-3xl font-black tracking-tight ${balanceMesNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${balanceMesNeto.toLocaleString('es-AR')}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Ingresos: ${ingresosMesTotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Gastos: ${gastosMesTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* CARD 2: SECTOR SOCIOS - GRÁFICO CIRCULAR DE CUOTAS AL DÍA */}
        <div 
          onClick={handleGoToSocios}
          className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-400" />
                Estado de Cuotas
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Socios al Día</h4>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between my-1">
            {/* Gráfico Donut SVG */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-white leading-none">{pctAlDia}%</span>
                <span className="text-[8px] font-extrabold text-emerald-400 uppercase mt-0.5">Al Día</span>
              </div>
            </div>

            {/* Leyendas al costado */}
            <div className="space-y-1.5 text-xs font-bold pl-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                <span className="text-slate-200">Al Día: <strong className="text-emerald-400 font-extrabold">{sociosAlDia}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                <span className="text-slate-200">Pendientes: <strong className="text-rose-400 font-extrabold">{sociosPendientes}</strong></span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                Total: {totalSocios} socios
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-400 font-bold flex items-center justify-between">
            <span>Ver Gestión de Socios</span>
            <span>→</span>
          </div>
        </div>

        {/* CARD 3: CANTIDAD DE SOCIOS ACTIVOS */}
        <div 
          onClick={handleGoToSocios}
          className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-blue-500/50 p-5 rounded-3xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                Socios Activos
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Padrón de Miembros del Club</h4>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">
              {totalSocios} <span className="text-sm font-semibold text-blue-300">Socios Activos</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="text-slate-400 font-medium">Categorías y Planteles Activos</span>
            <span className="text-blue-400 font-bold group-hover:translate-x-1 transition-transform">Ver Padrón →</span>
          </div>
        </div>

        {/* CARD 4: COMPROBANTES PENDIENTES DE REVISIÓN */}
        <div 
          onClick={handleGoToAuditoria}
          className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border p-5 rounded-3xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
            totalPendientesCount > 0 
              ? 'border-purple-500/40 hover:border-purple-400 shadow-purple-950/20' 
              : 'border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Auditoría
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Comprobantes por Revisar</h4>
            </div>
            <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${
              totalPendientesCount > 0 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              {totalPendientesCount}
              <span className="text-sm font-bold text-slate-300">
                {totalPendientesCount === 1 ? 'Pendiente' : 'Pendientes'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
            {totalPendientesCount > 0 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Atención requerida: Auditar ahora
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ¡Todo al día! Sin pendientes
              </span>
            )}
            <span className="text-purple-400 font-bold group-hover:translate-x-1 transition-transform">Ir →</span>
          </div>
        </div>

      </div>
    </div>
  );
};
