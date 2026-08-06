import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileCheck, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Trophy, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Filter, 
  DollarSign,
  RefreshCw,
  Zap,
  CheckCheck,
  Link,
  ShieldCheck,
  Search,
  Share2,
  EyeOff,
  RotateCcw
} from 'lucide-react';

import { MainDashboardSummary } from './MainDashboardSummary';
import { HistorialMovimientosTable } from './HistorialMovimientosTable';
import { ModalDetalleCajaEfectivo } from './Modals/ModalDetalleCajaEfectivo';
import { isDateInRange } from '../utils/dateUtils';

export const DashboardContador = ({ onOpenModalUser, onNavigate, initialTab = 'control_financiero' }) => {
  const [detalleCajaModal, setDetalleCajaModal] = useState(null);
  const { 
    payments, 
    users,
    movimientosFinancieros, 
    mercadoPagoTransfers, 
    stats, 
    clubSettings, 
    addMovimientoFinanciero, 
    deleteMovimientoFinanciero,
    vincularTransferenciaMP,
    sincronizarMercadoPago,
    cuotasPorCategoria,
    updateCuotaCategoria,
    cuotasPorDisciplina = {
      'Futbol Baby': 30000,
      'Futsal Femenino': 20000,
      'Futsal Masculino': 30000,
      'Futsal Mayores': 15000
    },
    updateCuotaDisciplina,
    deletePayment,
    updatePaymentStatus,
    fetchPaymentReceiptUrl,
    auditoriaFilterStatus,
    setAuditoriaFilterStatus,
    markNotificationsAsViewed,
    openFichaSocio
  } = useApp();

  const [activeTab, setActiveTab] = useState(initialTab); // 'control_financiero' (Balance General) | 'mp_feed' | 'auditoria'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#registro';
    const shareText = `Haedo Futsal App\nInscribite en la App Oficial del Club!\n${url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };
  const [showCuotasModal, setShowCuotasModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handleViewReceipt = async (p) => {
    if (p?.comprobanteUrl && p.comprobanteUrl.length > 20) {
      setSelectedReceipt(p.comprobanteUrl);
      return;
    }
    if (typeof fetchPaymentReceiptUrl === 'function' && p?.id) {
      const url = await fetchPaymentReceiptUrl(p.id);
      setSelectedReceipt(url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80');
    } else {
      setSelectedReceipt('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80');
    }
  };
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mpFilter, setMpFilter] = useState('sin_conciliar');
  const [descartadosIds, setDescartadosIds] = useState(() => {
    try {
      const saved = localStorage.getItem('haedo_mp_descartados');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedMpTxIds, setSelectedMpTxIds] = useState([]);

  const toggleDescartarMp = (txId) => {
    setDescartadosIds(prev => {
      const next = prev.includes(txId) ? prev.filter(id => id !== txId) : [...prev, txId];
      try { localStorage.setItem('haedo_mp_descartados', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const handleBulkDescartarMp = () => {
    if (selectedMpTxIds.length === 0) return;
    setDescartadosIds(prev => {
      const next = Array.from(new Set([...prev, ...selectedMpTxIds]));
      try { localStorage.setItem('haedo_mp_descartados', JSON.stringify(next)); } catch (e) {}
      return next;
    });
    setSelectedMpTxIds([]);
  };

  const toggleMpTxSelection = (txId) => {
    setSelectedMpTxIds(prev => prev.includes(txId) ? prev.filter(id => id !== txId) : [...prev, txId]);
  };

  const filterStatus = (auditoriaFilterStatus && typeof auditoriaFilterStatus === 'object') ? auditoriaFilterStatus.status : (auditoriaFilterStatus || 'en_revision');
  
  const setFilterStatus = (status) => {
    if (setAuditoriaFilterStatus) setAuditoriaFilterStatus(status);
    if (markNotificationsAsViewed) markNotificationsAsViewed(status);
  };

  useEffect(() => {
    if (auditoriaFilterStatus) {
      setActiveTab('auditoria');
      const targetStatus = (auditoriaFilterStatus && typeof auditoriaFilterStatus === 'object') ? auditoriaFilterStatus.status : auditoriaFilterStatus;
      if (markNotificationsAsViewed && targetStatus) markNotificationsAsViewed(targetStatus);
    } else {
      setActiveTab('control_financiero');
    }
  }, [auditoriaFilterStatus]);

  const handleBulkDelete = () => {
    if (selectedPayments.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar ${selectedPayments.length} comprobantes de forma permanente?`)) {
      selectedPayments.forEach(id => deletePayment(id));
      setSelectedPayments([]);
    }
  };

  const togglePaymentSelection = (id) => {
    setSelectedPayments(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Filters for Movimientos
  const [filterCaja, setFilterCaja] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterResponsable, setFilterResponsable] = useState('todos');

  // Date range filter — defaults to current month
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastOfMonthStr = `${lastOfMonth.getFullYear()}-${String(lastOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfMonth.getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo]   = useState(lastOfMonthStr);

  // Helper: check if a date string falls within the selected range (uses dateUtils.js)
  const inRange = (dateStr) => isDateInRange(dateStr, dateFrom, dateTo);

  // Filtered movimientos for historial (includes date + caja + tipo + responsable)
  const filteredMovimientos = movimientosFinancieros.filter(m => {
    if (!inRange(m.fecha)) return false;
    if (filterCaja !== 'todas' && m.caja !== filterCaja) return false;
    if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false;
    if (filterResponsable !== 'todos' && m.responsable && !m.responsable.toLowerCase().includes(filterResponsable.toLowerCase())) return false;
    return true;
  });

  // Financial stats filtered by the selected date range
  const paymentsInRange = payments.filter(p => p.estado === 'aprobado' && inRange(p.fecha || p.created_at));
  const totalRecaudadoFiltrado = paymentsInRange.reduce((sum, p) => sum + Number(p.monto), 0);

  const movCuotasIngreso = movimientosFinancieros.filter(m => m.caja === 'cuotas' && m.tipo === 'ingreso' && inRange(m.fecha));
  const movCuotasGasto   = movimientosFinancieros.filter(m => m.caja === 'cuotas' && m.tipo === 'gasto' && inRange(m.fecha));
  const movTorneosIngreso = movimientosFinancieros.filter(m => m.caja === 'torneos' && m.tipo === 'ingreso' && inRange(m.fecha));
  const movTorneosGasto   = movimientosFinancieros.filter(m => m.caja === 'torneos' && m.tipo === 'gasto' && inRange(m.fecha));

  const ingCuotas  = totalRecaudadoFiltrado + movCuotasIngreso.reduce((s, m) => s + Number(m.monto), 0);
  const gastCuotas = movCuotasGasto.reduce((s, m) => s + Number(m.monto), 0);
  const saldoCuotas = ingCuotas - gastCuotas;

  const ingTorneos  = movTorneosIngreso.reduce((s, m) => s + Number(m.monto), 0);
  const gastTorneos = movTorneosGasto.reduce((s, m) => s + Number(m.monto), 0);
  const saldoTorneos = ingTorneos - gastTorneos;

  const totalIngresos = ingCuotas + ingTorneos;
  const totalGastos   = gastCuotas + gastTorneos;
  const balanceTotal  = saldoCuotas + saldoTorneos;

  // Scanner & Auto-match state
  const [scanningId, setScanningId] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedTxForManualLink, setSelectedTxForManualLink] = useState(null);
  const [manualSearch, setManualSearch] = useState('');

  // Modal New Movimiento
  const [showModalMov, setShowModalMov] = useState(false);
  const [movForm, setMovForm] = useState({
    caja: 'cuotas',
    tipo: 'ingreso',
    monto: '',
    concepto: '',
    categoria: 'Cuotas'
  });

  const handleAddMovimiento = (e) => {
    e.preventDefault();
    if (!movForm.monto || !movForm.concepto) return;

    addMovimientoFinanciero({
      ...movForm,
      monto: Number(movForm.monto)
    });

    setMovForm({
      caja: 'cuotas',
      tipo: 'ingreso',
      monto: '',
      concepto: '',
      categoria: 'Cuotas'
    });
    setShowModalMov(false);
  };

  const cleanStr = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Auto-Match Scanner Simulator for Mercado Pago Transfer
  const handleAutoMatch = (mpTx) => {
    setScanningId(mpTx.id);
    setMatchResult(null);

    setTimeout(() => {
      const cleanMPNum = cleanStr(mpTx.numeroOperacion);
      const cleanMPCoelsa = cleanStr(mpTx.coelsaId);

      // Search across ALL payments (en_revision or aprobado)
      const match = payments.find(p => {
        const pNum = cleanStr(p.numeroOperacion);
        if (cleanMPNum && pNum && (pNum === cleanMPNum || pNum.includes(cleanMPNum) || cleanMPNum.includes(pNum))) return true;
        if (cleanMPCoelsa && pNum && (pNum === cleanMPCoelsa || pNum.includes(cleanMPCoelsa) || cleanMPCoelsa.includes(pNum))) return true;

        if (Number(p.monto) === Number(mpTx.monto)) {
          const emisorFirst = mpTx.emisorNombre.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
          const socioNorm = p.socioNombre.toLowerCase().replace(/[^a-z]/g, '');
          if (emisorFirst.length >= 3 && socioNorm.includes(emisorFirst)) return true;
        }
        return false;
      });

      if (match) {
        vincularTransferenciaMP(mpTx.id, match.id);
        setMatchResult({
          type: 'success',
          message: `¡COINCIDENCIA EXACTA! Transferencia N° ${mpTx.numeroOperacion} conciliada con comprobante de ${match.socioNombre}. Cuota acreditada en tiempo real.`
        });
      } else {
        setMatchResult({
          type: 'warning',
          message: `No se encontró coincidencia automática para N° ${mpTx.numeroOperacion}. Se abrió la ventana de vinculación manual.`
        });
        setSelectedTxForManualLink(mpTx);
      }
      setScanningId(null);
    }, 600);
  };

  const filteredPayments = payments.filter(p => {
    if (filterStatus === 'todos') return true;
    return p.estado === filterStatus;
  });

  const pendientesRevCount = payments.filter(p => p.estado === 'en_revision').length;

  // Month label for the date filter display
  const monthLabel = new Date(dateFrom + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Finanzas</h2>
        </div>

        {/* Main Sub-Tabs + Precios Cuotas in 2 lines */}
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('control_financiero')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'control_financiero'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            Balance
          </button>

          <button
            onClick={() => setActiveTab('mp_feed')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'mp_feed'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            Transf. MP
            {mercadoPagoTransfers.filter(t => t.estado === 'sin_vincular').length > 0 && (
              <span className="bg-sky-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                {mercadoPagoTransfers.filter(t => t.estado === 'sin_vincular').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            Comprobantes
            {pendientesRevCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                {pendientesRevCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowCuotasModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            $ Cuotas
          </button>
        </div>
      </div>

      {/* TAB 1: CONTROL FINANCIERO & BALANCE GENERAL */}
      {activeTab === 'control_financiero' && (
        <div className="space-y-6">
          {/* Balance General Banner */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-amber-400" /> Período:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono outline-none focus:border-amber-400"
                />
                <span className="text-slate-500 text-xs">al</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[11px] text-amber-400 font-semibold capitalize bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                {monthLabel}
              </span>
              <button
                onClick={() => { setDateFrom(firstOfMonth); setDateTo(lastOfMonthStr); }}
                className="text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                Mes actual
              </button>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div 
                onClick={() => setDetalleCajaModal({ title: 'Balance General', type: 'todas' })}
                className="cursor-pointer group hover:opacity-90 transition-opacity"
                title="Haz clic para ver desglose en Cuenta vs Efectivo por Staff"
              >
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Scale className="w-4 h-4" /> BALANCE GENERAL DEL CLUB <span className="text-[10px] text-sky-400 font-semibold lowercase underline group-hover:text-amber-300">(ver desglose)</span>
                </span>
                <div className={`text-3xl sm:text-4xl font-black ${
                  balanceTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ${balanceTotal.toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Ingresos: ${totalIngresos.toLocaleString('es-AR')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Egresos: ${totalGastos.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowModalMov(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Registrar Ingreso / Gasto
                </button>
              </div>
            </div>
          </div>

          {/* Las 2 Cajas Separadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CAJA 1: CUOTAS */}
            <div 
              onClick={() => setDetalleCajaModal({ title: 'Caja 1: Cuotas', type: 'cuotas' })}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 hover:border-amber-400 p-5 rounded-2xl shadow-xl space-y-4 cursor-pointer transition-all hover:scale-[1.01] group"
              title="Haz clic para ver desglose en Cuenta vs Efectivo"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> CAJA 1: CUOTAS <span className="text-[10px] text-sky-400 font-semibold lowercase underline group-hover:text-amber-300">(ver desglose)</span>
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    ${saldoCuotas.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-all">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Ingresos Cuotas</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">${ingCuotas.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Gastos Operativos</div>
                  <div className="text-rose-400 font-bold text-sm mt-0.5">${gastCuotas.toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>

            {/* CAJA 2: TORNEOS */}
            <div 
              onClick={() => setDetalleCajaModal({ title: 'Caja 2: Torneos', type: 'torneos' })}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 border border-blue-500/30 hover:border-blue-400 p-5 rounded-2xl shadow-xl space-y-4 cursor-pointer transition-all hover:scale-[1.01] group"
              title="Haz clic para ver desglose en Cuenta vs Efectivo"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> CAJA 2: TORNEOS <span className="text-[10px] text-sky-400 font-semibold lowercase underline group-hover:text-blue-300">(ver desglose)</span>
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    ${saldoTorneos.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl group-hover:scale-110 transition-all">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Ingresos Torneos</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">${ingTorneos.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Gastos Torneos/Arbitraje</div>
                  <div className="text-rose-400 font-bold text-sm mt-0.5">${gastTorneos.toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Movimientos Contables Compacta Reusable */}
          <HistorialMovimientosTable />
        </div>
      )}

      {/* Modal Desglose Efectivo vs Banco por Staff */}
      {detalleCajaModal && (
        <ModalDetalleCajaEfectivo
          cajaTitle={detalleCajaModal.title}
          cajaType={detalleCajaModal.type}
          onClose={() => setDetalleCajaModal(null)}
        />
      )}

      {/* TAB 2: TRANSFERENCIAS EN VIVO MERCADO PAGO */}
      {activeTab === 'mp_feed' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-sky-500/30 p-5 rounded-2xl shadow-xl">
            <div className="mb-4">
              <h3 className="text-xl font-extrabold text-white">Transferencias Recibidas</h3>
            </div>

            {/* Notification alert banner */}
            {matchResult && (
              <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
                matchResult.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200' : 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
              }`}>
                <span>{matchResult.message}</span>
                <button onClick={() => setMatchResult(null)} className="font-bold hover:text-white">✕</button>
              </div>
            )}

            {/* Filter bar for MP Transfers */}
            {(() => {
              const cleanStrLocal = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

              const getTxStatusInfo = (tx) => {
                const cleanTxNum = cleanStrLocal(tx.numeroOperacion);
                const cleanTxCoelsa = cleanStrLocal(tx.coelsaId);

                const matchedApprovedPayment = payments.find(p => 
                  p.estado === 'aprobado' && (
                    (cleanTxNum && cleanStrLocal(p.numeroOperacion) === cleanTxNum) ||
                    (cleanTxCoelsa && cleanStrLocal(p.numeroOperacion) === cleanTxCoelsa) ||
                    (cleanTxCoelsa && cleanStrLocal(p.coelsaId) === cleanTxCoelsa) ||
                    (p.observaciones && p.observaciones.includes(tx.numeroOperacion))
                  )
                );

                const isConciliado = tx.estado === 'conciliado' || tx.estado_conciliacion === 'conciliado' || Boolean(matchedApprovedPayment);
                const isDescartado = tx.descartado || descartadosIds.includes(tx.id) || descartadosIds.includes(tx.numeroOperacion);
                const socioNombreConciliado = tx.socioNombre || matchedApprovedPayment?.socioNombre || 'Socio Acreditado';

                return { isConciliado, isDescartado, socioNombreConciliado };
              };

              const sinConciliarCount = mercadoPagoTransfers.filter(tx => !getTxStatusInfo(tx).isConciliado && !getTxStatusInfo(tx).isDescartado).length;
              const conciliadasCount = mercadoPagoTransfers.filter(tx => getTxStatusInfo(tx).isConciliado).length;
              const descartadasCount = mercadoPagoTransfers.filter(tx => getTxStatusInfo(tx).isDescartado).length;

              const visibleList = mercadoPagoTransfers.filter(tx => {
                const { isConciliado, isDescartado } = getTxStatusInfo(tx);
                if (mpFilter === 'sin_conciliar') return !isConciliado && !isDescartado;
                if (mpFilter === 'conciliado') return isConciliado;
                if (mpFilter === 'descartado') return isDescartado;
                return true;
              });

              return (
                <>
                  <div className="flex flex-col gap-2 my-4 pb-3 border-b border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {[
                        { id: 'sin_conciliar', label: `Sin Conciliar (${sinConciliarCount})` },
                        { id: 'conciliado', label: `Conciliadas (${conciliadasCount})` },
                        { id: 'descartado', label: `Descartadas (${descartadasCount})` },
                        { id: 'todos', label: `Todas (${mercadoPagoTransfers.length})` }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setMpFilter(t.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                            mpFilter === t.id 
                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-extrabold scale-102' 
                              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {selectedMpTxIds.length > 0 && (
                      <button
                        onClick={handleBulkDescartarMp}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Ignorar Seleccionadas ({selectedMpTxIds.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    {visibleList.length === 0 ? (
                      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-10 text-center text-slate-400">
                        <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <div className="font-bold text-white text-sm">No hay transferencias en esta sección</div>
                        <p className="text-xs text-slate-500 mt-1">Usa los filtros de arriba para ver las conciliadas, descartadas o todas.</p>
                      </div>
                    ) : (
                      visibleList.map((tx) => {
                        const { isConciliado, isDescartado, socioNombreConciliado } = getTxStatusInfo(tx);
                        const isScanning = scanningId === tx.id;
                        const isChecked = selectedMpTxIds.includes(tx.id);

                        return (
                          <div 
                            key={tx.id}
                            className={`bg-slate-950 border p-4 rounded-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                              isConciliado ? 'border-emerald-500/30 bg-slate-950/40' :
                              isDescartado ? 'border-slate-800/60 opacity-60 bg-slate-950/20' :
                              'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {!isConciliado && (
                                <div className="pt-1">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleMpTxSelection(tx.id)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950 cursor-pointer"
                                  />
                                </div>
                              )}
                              <div className={`p-2.5 rounded-xl text-xs font-bold shrink-0 ${
                                isConciliado ? 'bg-emerald-500/20 text-emerald-400' :
                                isDescartado ? 'bg-slate-800 text-slate-500' :
                                'bg-sky-500/20 text-sky-400'
                              }`}>
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-white text-base">{tx.emisorNombre}</span>
                                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                    {tx.billeteraOrigen}
                                  </span>
                                  {isDescartado && (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                      Ignorada / No es Cuota
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  N° Operación MP: <strong className="font-mono text-slate-200">{tx.numeroOperacion}</strong>
                                  {tx.coelsaId && <> • COELSA ID: <strong className="font-mono text-sky-300">{tx.coelsaId}</strong></>}
                                  • {tx.fecha}
                                </div>
                                {isConciliado && (
                                  <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                    <CheckCheck className="w-3.5 h-3.5" /> Conciliado con socio: {socioNombreConciliado}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                              <div className="text-right">
                                <div className="text-lg font-black text-emerald-400">${Number(tx.monto).toLocaleString('es-AR')}</div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                  isConciliado ? 'bg-emerald-500/20 text-emerald-300' :
                                  isDescartado ? 'bg-slate-800 text-slate-400' :
                                  'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {isConciliado ? 'Acreditado' : isDescartado ? 'Ignorada' : 'Sin Vincular'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {!isConciliado && !isDescartado && (
                                  <>
                                    <button
                                      disabled={isScanning}
                                      onClick={() => handleAutoMatch(tx)}
                                      className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 disabled:opacity-50 cursor-pointer"
                                    >
                                      <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-bounce' : ''}`} />
                                      {isScanning ? 'Comparando...' : 'Comparar'}
                                    </button>

                                    <button
                                      onClick={() => setSelectedTxForManualLink(tx)}
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                                      title="Vincular manualmente seleccionando a un socio"
                                    >
                                      <Link className="w-3.5 h-3.5 text-amber-400" /> Manual
                                    </button>

                                    <button
                                      onClick={() => toggleDescartarMp(tx.id)}
                                      className="bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1 border border-slate-800 transition-all cursor-pointer"
                                      title="Ignorar de la lista de cuotas (ej: transferencias de $1.000.000 u otros gastos)"
                                    >
                                      <EyeOff className="w-3.5 h-3.5 text-slate-500" /> Ignorar
                                    </button>
                                  </>
                                )}

                                {isDescartado && (
                                  <button
                                    onClick={() => toggleDescartarMp(tx.id)}
                                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-amber-500/30 transition-all cursor-pointer"
                                    title="Restaurar a la lista de Sin Conciliar"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORÍA DE COMPROBANTES MERCADO PAGO */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'en_revision', label: `Pendientes de Revisión (${pendientesRevCount})` },
                { id: 'aprobado', label: 'Aprobados' },
                { id: 'rechazado', label: 'Rechazados' },
                { id: 'todos', label: 'Historial Completo' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    filterStatus === tab.id 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' 
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {selectedPayments.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Eliminar ({selectedPayments.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {filteredPayments.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <div className="font-bold text-white">No hay comprobantes en esta sección</div>
                <p className="text-xs text-slate-500 mt-1">Todos los comprobantes reportados han sido procesados.</p>
              </div>
            ) : (
              filteredPayments.map(p => {
                const walletLabel = (p.billeteraOrigen && p.billeteraOrigen.toLowerCase() !== 'desconocida') 
                  ? p.billeteraOrigen 
                  : 'Comprobante';

                const isGenericEmisor = !p.emisorNombre || (
                  p.emisorNombre.toLowerCase().includes('transferencia') ||
                  p.emisorNombre.toLowerCase().includes('desconocid')
                );

                const isSameEmisor = isGenericEmisor || (
                  p.emisorNombre.trim().toLowerCase() === (p.socioNombre || '').trim().toLowerCase() ||
                  p.emisorNombre.toLowerCase().includes('titular')
                );

                return (
                  <div 
                    key={p.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                      p.estado === 'en_revision' ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="pt-1">
                          <input 
                            type="checkbox" 
                            checked={selectedPayments.includes(p.id)}
                            onChange={() => togglePaymentSelection(p.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                            {walletLabel} • N° {p.numeroOperacion}
                          </div>
                          <div className="font-extrabold text-base sm:text-lg text-white mt-0.5 truncate">{p.socioNombre}</div>
                          {!isSameEmisor && (
                            <div className="text-[11px] text-amber-400/90 font-medium truncate">
                              Pagado por: {p.emisorNombre}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-lg sm:text-xl font-black text-emerald-400">${Number(p.monto).toLocaleString('es-AR')}</div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                            p.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            p.estado === 'en_revision' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {p.estado === 'aprobado' ? 'Aprobado' : p.estado === 'en_revision' ? 'Pendiente' : 'Rechazado'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs mb-4 space-y-1">
                        <div className="text-slate-400 text-[11px] font-semibold">Fecha de Transferencia: {p.fechaTransferencia}</div>
                        <div className="text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                          {p.observaciones}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 w-full">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(p)}
                        className="w-full px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-400 shrink-0" /> Ver Captura
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar este comprobante para siempre? Esta acción restará el dinero del balance si estaba aprobado.')) {
                            deletePayment(p.id);
                          }
                        }}
                        className="w-full px-2 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" /> Eliminar
                      </button>

                      {p.estado === 'en_revision' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updatePaymentStatus(p.id, 'rechazado', 'N° de Operación o datos no verificados')}
                            className="w-full px-2 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 shrink-0" /> Rechazar
                          </button>

                          <button
                            type="button"
                            onClick={() => updatePaymentStatus(p.id, 'aprobado', 'Verificado y acreditado manualmente')}
                            className="w-full px-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" /> Aprobar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      {showModalMov && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Registrar Movimiento de Caja
              </h3>
              <button onClick={() => setShowModalMov(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddMovimiento} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Seleccionar Caja Destino</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, caja: 'cuotas' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movForm.caja === 'cuotas'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Caja Cuotas
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, caja: 'torneos' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movForm.caja === 'torneos'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Caja Torneos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'ingreso' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movForm.tipo === 'ingreso'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    + Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovForm({ ...movForm, tipo: 'gasto' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movForm.tipo === 'gasto'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    - Gasto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold font-mono">Monto ($)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 15000"
                  value={movForm.monto}
                  onChange={(e) => setMovForm({ ...movForm, monto: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Concepto / Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de arbitrajes Fecha 2"
                  value={movForm.concepto}
                  onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Categoría</label>
                <select
                  value={movForm.categoria}
                  onChange={(e) => setMovForm({ ...movForm, categoria: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="Cuotas">Cuotas Sociales</option>
                  <option value="Torneos">Inscripción Torneos</option>
                  <option value="Arbitrajes">Arbitrajes y Planillas</option>
                  <option value="Indumentaria e Insumos">Indumentaria e Insumos</option>
                  <option value="Mantenimiento">Mantenimiento de Sede</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalMov(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`bg-slate-900 border border-slate-700 rounded-2xl ${isZoomed ? 'w-full max-w-5xl max-h-[95vh]' : 'max-w-lg w-full'} p-4 space-y-3 my-auto transition-all duration-300 flex flex-col shadow-2xl`}>
            <div className="flex justify-between items-center bg-slate-900 z-10 py-1 border-b border-slate-800 pb-2">
              <h4 className="font-bold text-white text-sm">Vista Previa de Comprobante {isZoomed && '(Lupa Activa)'}</h4>
              <div className="flex gap-4 items-center">
                {!selectedReceipt.includes('application/pdf') && (
                  <button onClick={() => setIsZoomed(!isZoomed)} className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer flex items-center gap-1">
                    {isZoomed ? '🔍 Alejar (Normal)' : '🔎 Acercar (Lupa)'}
                  </button>
                )}
                <button onClick={() => { setSelectedReceipt(null); setIsZoomed(false); }} className="text-slate-400 hover:text-white p-1 font-bold text-base cursor-pointer">✕</button>
              </div>
            </div>
            {selectedReceipt.includes('application/pdf') ? (
              <iframe src={selectedReceipt} className="w-full h-96 rounded-xl border border-slate-800" title="PDF Comprobante" />
            ) : (
              <div 
                className={`w-full overflow-auto rounded-xl border border-slate-800 bg-black/90 p-2 flex items-center justify-center ${isZoomed ? 'min-h-[75vh] max-h-[82vh] cursor-zoom-out' : 'max-h-[60vh] cursor-zoom-in'}`} 
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img 
                  src={selectedReceipt} 
                  alt="Comprobante" 
                  className={`transition-all duration-300 shadow-2xl rounded-lg ${isZoomed ? 'w-full h-auto max-w-full object-contain scale-110 md:scale-125 my-auto' : 'max-h-[55vh] w-auto h-auto object-contain mx-auto'}`} 
                />
              </div>
            )}
            <button 
              onClick={() => { setSelectedReceipt(null); setIsZoomed(false); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Precios de Cuotas por Disciplina */}
      {showCuotasModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                Precios de Cuotas por Disciplina
              </h3>
              <button onClick={() => setShowCuotasModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Fijá el importe mensual por disciplina. Los cambios impactarán automáticamente en la grilla de pagos de todos los socios vinculados.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-[11px] text-amber-400 font-bold uppercase tracking-wider">Fecha / Mes de Impacto del Precio:</label>
              <select className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold">
                <option value="inmediato">Inmediato (Cuota Mes Actual)</option>
                <option value="siguiente">A partir del Próximo Mes (Agosto 2026)</option>
                <option value="septiembre">A partir de Septiembre 2026</option>
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[
                { name: 'Futbol Baby', defaultPrice: 30000, desc: 'Categorías EDEFI Baby (2012 a 2020)' },
                { name: 'Futsal Femenino', defaultPrice: 20000, desc: 'Categoría BAFI Femenino (1ra, Reserva)' },
                { name: 'Futsal Masculino', defaultPrice: 30000, desc: 'FUTSALA Promo, FUTSALA Masculino, BAFI Masculino' },
                { name: 'Futsal Mayores', defaultPrice: 15000, desc: 'Categoría EDEFI Mayores (+30, +35, +42)' }
              ].map((disc) => (
                <div key={disc.name} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {disc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {disc.desc}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={cuotasPorDisciplina[disc.name] ?? disc.defaultPrice}
                      onChange={(e) => updateCuotaDisciplina && updateCuotaDisciplina(disc.name, e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 text-emerald-400 font-extrabold px-2.5 py-1.5 rounded-lg text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowCuotasModal(false);
                alert('✅ Precios de cuotas por disciplina actualizados con éxito.');
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs cursor-pointer"
            >
              Guardar Precios de Cuotas
            </button>
          </div>
        </div>
      )}

      {/* Modal de Vinculación Manual de Transferencia MP */}
      {selectedTxForManualLink && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Link className="w-5 h-5 text-amber-400" />
                Vincular Transferencia Manualmente
              </h3>
              <button onClick={() => setSelectedTxForManualLink(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">Datos de Mercado Pago:</div>
              <div className="font-extrabold text-white text-sm">{selectedTxForManualLink.emisorNombre}</div>
              <div className="text-emerald-400 font-bold text-sm">${Number(selectedTxForManualLink.monto).toLocaleString('es-AR')}</div>
              <div className="text-slate-400 text-[11px] font-mono">
                N° Op: {selectedTxForManualLink.numeroOperacion} • COELSA: {selectedTxForManualLink.coelsaId || 'N/D'}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5">Buscar Socio para Vincular:</label>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre, apellido, N° socio..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {users.filter(u => {
                  if (!manualSearch) return true;
                  const query = manualSearch.toLowerCase();
                  return `${u.nombre} ${u.apellido}`.toLowerCase().includes(query) || String(u.numeroSocio).includes(query);
                }).map(u => {
                  const userPayment = payments.find(p => p.socioId === u.id && p.estado === 'en_revision');
                  return (
                    <div 
                      key={u.id}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-all"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => openFichaSocio(u)}
                          className="font-bold text-white hover:text-amber-400 hover:underline text-sm text-left transition-colors cursor-pointer"
                          title="Ver Ficha Personal del Socio"
                        >
                          {u.nombre} {u.apellido}
                        </button>
                        <div className="text-slate-400 text-[11px]">
                          N° Socio: #{u.numeroSocio} • Estado: <span className={u.estadoCuota === 'al_dia' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{(u.estadoCuota || '').replace('_', ' ').toUpperCase()}</span>
                        </div>
                        {userPayment && (
                          <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                            Comprobante pendiente: N° {userPayment.numeroOperacion} (${userPayment.monto})
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const paymentIdToLink = userPayment ? userPayment.id : `pay-manual-${u.id}-${Date.now()}`;
                          vincularTransferenciaMP(selectedTxForManualLink.id, paymentIdToLink);
                          setSelectedTxForManualLink(null);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 shadow-lg shadow-emerald-500/20"
                      >
                        Vincular & Aprobar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTxForManualLink(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
