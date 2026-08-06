import React from 'react';
import { useApp } from '../context/AppContext';
import { isSameMonthAndYear } from '../utils/dateUtils';
import { HistorialMovimientosTable } from './HistorialMovimientosTable';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  ShieldCheck,
  Bell,
  Megaphone
} from 'lucide-react';

export const MainDashboardSummary = ({ onNavigate }) => {
  const { 
    users = [], 
    payments = [], 
    movimientosFinancieros = [], 
    notices = [],
    currentUser,
    openAuditoriaStatus,
    setAuditoriaFilterStatus
  } = useApp();

  const isStaffAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'contador';

  // 1. Filtrar solo usuarios con rol de socio
  const socios = users.filter(u => (!u.rol || u.rol === 'socio'));
  const totalSocios = socios.length;
  const sociosAlDia = socios.filter(s => s.estadoCuota === 'al_dia').length;
  const sociosEnRevision = payments.filter(p => p.estado === 'en_revision').length;
  const sociosPendientes = totalSocios - sociosAlDia;
  const pctAlDia = totalSocios > 0 ? Math.round((sociosAlDia / totalSocios) * 100) : 0;

  // 2. Comunicados stats
  const totalNoticesCount = notices.length;
  const lastNotice = notices[0];

  // 3. Cálculo de Finanzas del Mes Actual usando dateUtils
  const pagosAprobadosMes = payments.filter(p => p.estado === 'aprobado' && isSameMonthAndYear(p.fecha || p.created_at));
  const totalPagosMes = pagosAprobadosMes.reduce((sum, p) => sum + Number(p.monto || 0), 0);

  const movIngresosMes = movimientosFinancieros.filter(m => m.tipo === 'ingreso' && isSameMonthAndYear(m.fecha));
  const totalMovIngresosMes = movIngresosMes.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const ingresosMesTotal = totalPagosMes + totalMovIngresosMes;

  // Egresos / Gastos del mes
  const movGastosMes = movimientosFinancieros.filter(m => m.tipo === 'gasto' && isSameMonthAndYear(m.fecha));
  const gastosMesTotal = movGastosMes.reduce((sum, m) => sum + Number(m.monto || 0), 0);

  const balanceMesNeto = ingresosMesTotal - gastosMesTotal;

  // 4. Comprobantes pendientes de revisión
  const comprobantesPendientes = payments.filter(p => p.estado === 'en_revision');
  const totalPendientesCount = comprobantesPendientes.length;

  // 3D SVG Donut calculation (Radius 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const strokeDashoffset = circumference - (pctAlDia / 100) * circumference;

  const handleGoToFinance = () => {
    if (onNavigate && isStaffAdmin) onNavigate('finance');
  };

  const handleGoToSocios = () => {
    if (onNavigate) onNavigate('users');
  };

  const handleGoToNotices = () => {
    if (onNavigate) onNavigate('notices');
  };

  const handleGoToAuditoria = () => {
    if (!isStaffAdmin) return;
    if (openAuditoriaStatus) {
      openAuditoriaStatus('en_revision');
    } else if (setAuditoriaFilterStatus) {
      setAuditoriaFilterStatus('en_revision');
    }
    if (onNavigate) onNavigate('finance');
  };

  return (
    <div className="space-y-6">
      
      {/* Grid de Tarjetas Interactivas del Panel Principal */}
      <div className={`grid grid-cols-1 ${isStaffAdmin ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'} gap-5`}>
        
        {/* CARD 1: ESTADO DE CUOTAS MENSUAL */}
        <div 
          onClick={handleGoToSocios}
          className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-amber-400" />
                Estado de Cuotas Mensual
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Socios al Día</h4>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Gráfico Donut 3D Profesional */}
          <div className="flex items-center justify-between my-2">
            
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_8px_16px_rgba(16,185,129,0.3)]" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="donutGrad3DMain" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <filter id="shadow3DMain" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                </defs>

                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-slate-950"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />

                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-slate-800/80"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />

                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#donutGrad3DMain)"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  filter="url(#shadow3DMain)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                <span className="text-lg font-black text-white leading-none tracking-tight">{pctAlDia}%</span>
                <span className="text-[9px] font-black text-emerald-400 uppercase mt-0.5 tracking-wider">AL DÍA</span>
              </div>
            </div>

            {/* Leyendas al costado */}
            <div className="space-y-2 text-xs font-bold pl-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                  Al Día:
                </span>
                <strong className="text-emerald-400 font-extrabold">{sociosAlDia}</strong>
              </div>

              {sociosEnRevision > 0 && (
                <div className="flex items-center justify-between text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    En Revisión:
                  </span>
                  <strong className="font-extrabold">{sociosEnRevision}</strong>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                  Pendientes:
                </span>
                <strong className="text-rose-400 font-extrabold">{sociosPendientes}</strong>
              </div>

              <div className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-800/80">
                Padrón Total: {totalSocios} socios
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-400 font-bold flex items-center justify-between group-hover:text-amber-300">
            <span>Ver Gestión de Socios</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* CARD 2: DASHBOARD RESUMIDO DE COMUNICADOS / AVISOS */}
        <div 
          onClick={handleGoToNotices}
          className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-sky-500/50 p-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-sky-400" />
                Comunicados del Club
              </span>
              <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Avisos y Novedades</h4>
            </div>
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl group-hover:scale-110 group-hover:bg-sky-500/20 transition-all">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>

          <div className="my-2 space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
              {totalNoticesCount}
              <span className="text-sm font-semibold text-sky-300">Avisos Activos</span>
            </div>

            {lastNotice ? (
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-amber-400 font-bold uppercase truncate">
                  📌 {lastNotice.titulo}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-1 font-medium">
                  {lastNotice.contenido}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No hay avisos recientes</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-sky-400 font-bold flex items-center justify-between group-hover:text-sky-300">
            <span>Ver Comunicados del Club</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* CARD 3: SECTOR FINANZAS - BALANCE DEL MES (Solo Staff Admin / Contador) */}
        {isStaffAdmin && (
          <div 
            onClick={handleGoToFinance}
            className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Sector Finanzas
                </span>
                <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Balance Neto del Mes</h4>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3">
              <div className={`text-3xl sm:text-4xl font-black tracking-tight ${balanceMesNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${balanceMesNeto.toLocaleString('es-AR')}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Ingresos: ${ingresosMesTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-1 text-rose-400">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Gastos: ${gastosMesTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-emerald-400 font-bold flex items-center justify-between group-hover:text-emerald-300">
                <span>Ver Balance General Completo</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        )}

        {/* CARD 4: AUDITORÍA DE PAGOS (Solo Staff Admin / Contador) */}
        {isStaffAdmin && (
          <div 
            onClick={handleGoToAuditoria}
            className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border p-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
              totalPendientesCount > 0 
                ? 'border-purple-500/40 hover:border-purple-400 shadow-purple-950/20' 
                : 'border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Auditoría de Pagos
                </span>
                <h4 className="text-xs font-semibold text-slate-400 mt-0.5">Comprobantes por Revisar</h4>
              </div>
              <div className={`p-3 rounded-2xl group-hover:scale-110 transition-all ${
                totalPendientesCount > 0 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                {totalPendientesCount}
                <span className="text-sm font-bold text-slate-300">
                  {totalPendientesCount === 1 ? 'Pendiente' : 'Pendientes'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-bold">
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
              </div>

              <div className="text-[11px] text-purple-400 font-bold flex items-center justify-between group-hover:text-purple-300">
                <span>Ir a Auditoría de Pagos</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Historial de Movimientos Visible en Panel Principal para Staff */}
      {isStaffAdmin && (
        <div className="pt-2">
          <HistorialMovimientosTable limit={10} />
        </div>
      )}
    </div>
  );
};
