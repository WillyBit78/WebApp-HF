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
  Share2
} from 'lucide-react';

export const DashboardContador = ({ onOpenModalUser }) => {
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
    deletePayment,
    updatePaymentStatus,
    auditoriaFilterStatus,
    setAuditoriaFilterStatus,
    markNotificationsAsViewed
  } = useApp();

  const [activeTab, setActiveTab] = useState('control_financiero'); // 'control_financiero' | 'mp_feed' | 'auditoria'
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
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [isZoomed, setIsZoomed] = useState(false);

  const filterStatus = typeof auditoriaFilterStatus === 'object' ? auditoriaFilterStatus.status : (auditoriaFilterStatus || 'en_revision');
  
  const setFilterStatus = (status) => {
    if (setAuditoriaFilterStatus) setAuditoriaFilterStatus(status);
    if (markNotificationsAsViewed) markNotificationsAsViewed(status);
  };

  useEffect(() => {
    if (auditoriaFilterStatus) {
      setActiveTab('auditoria');
      const targetStatus = typeof auditoriaFilterStatus === 'object' ? auditoriaFilterStatus.status : auditoriaFilterStatus;
      if (markNotificationsAsViewed) markNotificationsAsViewed(targetStatus);
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

  const filteredMovimientos = movimientosFinancieros.filter(m => {
    if (filterCaja !== 'todas' && m.caja !== filterCaja) return false;
    if (filterTipo !== 'todos' && m.tipo !== filterTipo) return false;
    if (filterResponsable !== 'todos' && m.responsable && !m.responsable.toLowerCase().includes(filterResponsable.toLowerCase())) return false;
    return true;
  });

  const pendientesRevCount = payments.filter(p => p.estado === 'en_revision').length;

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/20 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" /> SECTOR FINANZAS Y CONTABILIDAD
          </div>
          <h2 className="text-2xl font-extrabold text-white">Gestión Financiera & Mercado Pago</h2>
          <p className="text-xs text-slate-400 mt-1">
            Conciliación inteligente en tiempo real para la cuenta <strong>{clubSettings.aliasMercadoPago}</strong>
          </p>
        </div>

        {/* 3 Main Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('control_financiero')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'control_financiero'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Scale className="w-4 h-4" />
            Balance General & Cajas
          </button>

          <button
            onClick={() => setActiveTab('mp_feed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'mp_feed'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Transferencias Mercado Pago
            {mercadoPagoTransfers.filter(t => t.estado === 'sin_vincular').length > 0 && (
              <span className="bg-sky-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                {mercadoPagoTransfers.filter(t => t.estado === 'sin_vincular').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Auditoría de Comprobantes
            {pendientesRevCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                {pendientesRevCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <button
            onClick={onOpenModalUser}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Alta Socio
          </button>
          
          <button
            onClick={handleCopyLink}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" /> {copiedLink ? '¡Link Copiado!' : 'Copiar Link'}
          </button>
        </div>
      </div>

      {/* TAB 1: CONTROL FINANCIERO & BALANCE GENERAL */}
      {activeTab === 'control_financiero' && (
        <div className="space-y-6">
          {/* Balance General Banner */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Scale className="w-4 h-4" /> BALANCE GENERAL TOTAL DEL CLUB
                </span>
                <div className={`text-3xl sm:text-4xl font-black ${
                  stats.balanceGeneralTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ${stats.balanceGeneralTotal.toLocaleString('es-AR')}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Ingresos Totales: ${stats.totalIngresosGlobal.toLocaleString('es-AR')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Egreso Total: ${stats.totalGastosGlobal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowCuotasModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <DollarSign className="w-4 h-4" /> Precios Cuotas por Categoría
                </button>
                <button
                  onClick={() => setShowModalMov(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" /> Registrar Ingreso / Gasto
                </button>
              </div>
            </div>
          </div>

          {/* Las 2 Cajas Separadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CAJA 1: CUOTAS MENSUALES */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> CAJA 1: CUOTAS MENSUALES
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    ${stats.saldoCajaCuotas.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Recaudación social & mantenimiento de sede
                  </span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Ingresos Cuotas</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">${stats.ingresosCuotasTotal.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Gastos Operativos</div>
                  <div className="text-rose-400 font-bold text-sm mt-0.5">${stats.gastosCuotasMov.toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>

            {/* CAJA 2: TORNEOS & LIGA */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 border border-blue-500/30 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> CAJA 2: TORNEOS & COMPETENCIAS
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    ${stats.saldoCajaTorneos.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Inscripciones a ligas, arbitrajes y planillas
                  </span>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Ingresos Torneos</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">${stats.ingresosTorneosTotal.toLocaleString('es-AR')}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Gastos Torneos/Arbitraje</div>
                  <div className="text-rose-400 font-bold text-sm mt-0.5">${stats.gastosTorneosTotal.toLocaleString('es-AR')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Movimientos Contables */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Historial de Movimientos de Caja
              </h3>

              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={filterResponsable}
                  onChange={(e) => setFilterResponsable(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-amber-300 px-3 py-1.5 rounded-xl font-bold"
                >
                  <option value="todos">Todos los Coaches / Responsables</option>
                  <option value="Diego Santi">Diego Santi (Coach DT)</option>
                  <option value="Mariana">Mariana López (Contador)</option>
                  <option value="Gonzalo">Gonzalo Martínez (Admin)</option>
                </select>

                <select
                  value={filterCaja}
                  onChange={(e) => setFilterCaja(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-medium"
                >
                  <option value="todas">Todas las Cajas</option>
                  <option value="cuotas">Caja Cuotas</option>
                  <option value="torneos">Caja Torneos</option>
                </select>

                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-medium"
                >
                  <option value="todos">Todos los Movimientos</option>
                  <option value="ingreso">Ingresos (+)</option>
                  <option value="gasto">Gastos (-)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Fecha</th>
                    <th className="p-3">Caja</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Concepto / Descripción</th>
                    <th className="p-3">Responsable / Custodia Efectivo</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-right rounded-r-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No hay movimientos registrados en este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{m.fecha}</td>
                        <td className="p-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                            m.caja === 'cuotas' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {m.caja === 'cuotas' ? 'Caja Cuotas' : 'Caja Torneos'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            m.tipo === 'ingreso' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {m.tipo === 'ingreso' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-white">{m.concepto}</td>
                        <td className="p-3 font-semibold text-amber-300 text-[11px]">
                          {m.responsable || 'Administración Central'}
                        </td>
                        <td className={`p-3 text-right font-black text-sm ${
                          m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => deleteMovimientoFinanciero(m.id)}
                            className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSFERENCIAS EN VIVO MERCADO PAGO */}
      {activeTab === 'mp_feed' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-sky-500/30 p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <RefreshCw className="w-4 h-4 animate-spin" /> CONEXIÓN EN TIEMPO REAL - MERCADO PAGO
                </span>
                <h3 className="text-xl font-extrabold text-white">Transferencias Recibidas en Cuenta del Club</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Alias oficial: <strong className="text-sky-300 font-mono">{clubSettings.aliasMercadoPago}</strong> • Titular: {clubSettings.cuentaTitular}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sincronizarMercadoPago()}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Ahora
                </button>
                <div className="bg-sky-950/40 border border-sky-500/20 px-3.5 py-2 rounded-xl text-xs text-sky-300 font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  API MP Conectada
                </div>
              </div>
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

            {/* MP Transfer List */}
            <div className="space-y-3 mt-4">
              {mercadoPagoTransfers.map((tx) => {
                const cleanTxNum = cleanStr(tx.numeroOperacion);
                const cleanTxCoelsa = cleanStr(tx.coelsaId);

                const matchedApprovedPayment = payments.find(p => 
                  p.estado === 'aprobado' && (
                    (cleanTxNum && cleanStr(p.numeroOperacion) === cleanTxNum) ||
                    (cleanTxCoelsa && cleanStr(p.numeroOperacion) === cleanTxCoelsa) ||
                    (p.observaciones && p.observaciones.includes(tx.numeroOperacion))
                  )
                );

                const isConciliado = tx.estado === 'conciliado' || Boolean(matchedApprovedPayment);
                const socioNombreConciliado = tx.socioNombre || matchedApprovedPayment?.socioNombre || 'Socio Acreditado';
                const isScanning = scanningId === tx.id;

                return (
                  <div 
                    key={tx.id}
                    className={`bg-slate-950 border p-4 rounded-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isConciliado ? 'border-emerald-500/30 bg-slate-950/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        isConciliado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                      }`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-base">{tx.emisorNombre}</span>
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {tx.billeteraOrigen}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          N° Operación MP: <strong className="font-mono text-slate-200">{tx.numeroOperacion}</strong> • {tx.fecha}
                        </div>
                        {isConciliado && (
                          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" /> Conciliado con socio: {socioNombreConciliado}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-400">${Number(tx.monto).toLocaleString('es-AR')}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          isConciliado ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isConciliado ? 'Acreditado' : 'Sin Vincular'}
                        </span>
                      </div>

                      {!isConciliado && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isScanning}
                            onClick={() => handleAutoMatch(tx)}
                            className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 disabled:opacity-50"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-bounce' : ''}`} />
                            {isScanning ? 'Comparando...' : 'Comparar & Conciliar'}
                          </button>
                          <button
                            onClick={() => setSelectedTxForManualLink(tx)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition-all"
                            title="Vincular manualmente seleccionando a un socio"
                          >
                            <Link className="w-3.5 h-3.5 text-amber-400" /> Manual
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORÍA DE COMPROBANTES MERCADO PAGO */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { id: 'en_revision', label: `Pendientes de Revisión (${pendientesRevCount})` },
                { id: 'aprobado', label: 'Aprobados' },
                { id: 'rechazado', label: 'Rechazados' },
                { id: 'todos', label: 'Historial Completo' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === tab.id 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              
              {selectedPayments.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar ({selectedPayments.length})
                </button>
              )}
            </div>
          </div>

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
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={selectedPayments.includes(p.id)}
                        onChange={() => togglePaymentSelection(p.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
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

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedReceipt(p.comprobanteUrl)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Captura
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de eliminar este comprobante para siempre? Esta acción restará el dinero del balance si estaba aprobado.')) {
                          deletePayment(p.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`bg-slate-900 border border-slate-700 rounded-2xl ${isZoomed ? 'w-full max-w-4xl' : 'max-w-lg w-full'} p-4 space-y-3 my-auto transition-all`}>
            <div className="flex justify-between items-center sticky top-0 bg-slate-900 z-10 py-2">
              <h4 className="font-bold text-white text-sm">Vista Previa de Comprobante {isZoomed && '(Lupa Activa)'}</h4>
              <div className="flex gap-4">
                {!selectedReceipt.includes('application/pdf') && (
                  <button onClick={() => setIsZoomed(!isZoomed)} className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
                    {isZoomed ? 'Alejar' : 'Acercar'}
                  </button>
                )}
                <button onClick={() => { setSelectedReceipt(null); setIsZoomed(false); }} className="text-slate-400 hover:text-white">✕</button>
              </div>
            </div>
            {selectedReceipt.includes('application/pdf') ? (
              <iframe src={selectedReceipt} className="w-full h-96 rounded-xl border border-slate-800" title="PDF Comprobante" />
            ) : (
              <div 
                className={`w-full overflow-auto rounded-xl border border-slate-800 bg-black/50 flex justify-center items-center cursor-zoom-in ${isZoomed ? 'h-[80vh] cursor-zoom-out' : 'h-80'}`} 
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img 
                  src={selectedReceipt} 
                  alt="Comprobante" 
                  className={`${isZoomed ? 'max-w-none w-auto' : 'w-full h-full object-contain'} transition-all`} 
                />
              </div>
            )}
            <button 
              onClick={() => { setSelectedReceipt(null); setIsZoomed(false); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Precios de Cuotas Mensuales por Categoría Madre */}
      {showCuotasModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                Precios de Cuotas por Categoría Madre
              </h3>
              <button onClick={() => setShowCuotasModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Las sub-categorías de cada plantel heredan el valor mensual fijado para su Categoría Madre correspondiente.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[
                { name: 'BAFI Femenino', tipo: 'Adulto', sub: '1ra, Reserva' },
                { name: 'EDEFI Mayores', tipo: 'Adulto', sub: '+30, +35, +42' },
                { name: 'EDEFI Baby', tipo: 'Infantil', sub: '2013, 2014, 2015, 2016, 2017, 2018' },
                { name: 'FUTSALA Promo', tipo: 'Infantil', sub: '2016, 2017, 2018' },
                { name: 'FUTSALA Masculino', tipo: 'Juvenil', sub: '1ra, 3ra, 4ta, 5ta, 6ta, 7ma, 8va' },
                { name: 'BAFI Masculino', tipo: 'Juvenil', sub: '1ra, Reserva, 3ra, 4ta, 5ta' }
              ].map((cat) => (
                <div key={cat.name} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      {cat.name}
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">{cat.tipo}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Sub-categorías: <strong className="text-amber-300/80">{cat.sub}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={cuotasPorCategoria[cat.name] || 15000}
                      onChange={(e) => updateCuotaCategoria(cat.name, e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 text-emerald-400 font-bold px-2.5 py-1.5 rounded-lg text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCuotasModal(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-red-500/20 text-xs"
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
                        <div className="font-bold text-white text-sm">{u.nombre} {u.apellido}</div>
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
