import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardSocios } from './DashboardSocios';
import { MainDashboardSummary } from './MainDashboardSummary';
import { 
  Users, 
  Wallet, 
  Trophy, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  DollarSign,
  Banknote,
  FileText,
  Filter,
  Search,
  History,
  CheckCheck,
  ShieldAlert,
  Share2,
  Eye,
  EyeOff,
  ChevronDown,
  Key
} from 'lucide-react';

export const DashboardAdmin = ({ onOpenModalUser, onOpenModalStaff, onOpenModalEvent, onNavigate, initialSubTab = 'resumen' }) => {
  const { 
    stats, 
    users, 
    payments, 
    events, 
    clubSettings, 
    setClubSettings, 
    deleteUser,
    logs,
    clearLogs,
    registrarPagoEfectivoCoach,
    registrarLog,
    openFichaSocio,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'resumen' | 'logs' | 'configuracion'
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState(clubSettings);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings confirmation modal
  const [showConfirmSettings, setShowConfirmSettings] = useState(false);
  const [settingsChanges, setSettingsChanges] = useState([]);
  const [showTokenMP, setShowTokenMP] = useState(false);

  // Log filter dropdown
  const [logFilterOpen, setLogFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLogFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '#registro';
    const shareText = `Haedo Futsal App\nInscribite en la App Oficial del Club!\n${url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Multi-select Filters for Audit Logs
  const [selectedEventTypes, setSelectedEventTypes] = useState([]); // [] means ALL
  const [logSearch, setLogSearch] = useState('');

  const toggleEventTypeFilter = (type) => {
    if (!type || type === 'todos') {
      setSelectedEventTypes([]);
      return;
    }
    setSelectedEventTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const eventTypeOptions = [
    { id: 'login_usuario', label: 'Inicios de Sesión', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { id: 'logout_usuario', label: 'Cierres de Sesión', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
    { id: 'comprobante_aprobado', label: 'Comprobantes Aprobados', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { id: 'comprobante_rechazado_duplicado', label: 'Duplicados / Rechazados', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'comprobante_recibido', label: 'Recibidos / En Revisión', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'comprobante_eliminado', label: 'Comprobantes Eliminados', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { id: 'pago_efectivo_coach', label: 'Pagos en Efectivo', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    { id: 'alta_usuario', label: 'Alta de Usuarios', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'modificacion_usuario', label: 'Modif. de Usuarios', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { id: 'baja_usuario', label: 'Baja de Usuarios', color: 'bg-rose-950/80 text-rose-300 border-rose-600' },
    { id: 'conciliacion_mp', label: 'Conciliación MP', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    { id: 'ingreso_manual', label: 'Ingresos Manuales', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { id: 'gasto_manual', label: 'Gastos Manuales', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
    { id: 'movimiento_eliminado', label: 'Movimientos Eliminados', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { id: 'modificacion_parametros', label: 'Modif. Parámetros', color: 'bg-amber-600/20 text-amber-300 border-amber-600/40' },
    { id: 'limpieza_logs', label: 'Limpieza de Logs', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    { id: 'error_sistema', label: 'Errores de Sistema', color: 'bg-rose-950 text-rose-300 border-rose-600' }
  ];

  // Cash payment modal state for socio
  const [cashModalSocio, setCashModalSocio] = useState(null);
  const [cashMonto, setCashMonto] = useState(15000);
  const [cashConcepto, setCashConcepto] = useState('Pago de cuota social mensual en efectivo');

  // Settings field labels for change detection
  const settingsFieldLabels = {
    nombreClub: 'Nombre del Club',
    aliasMercadoPago: 'Alias de Mercado Pago',
    cuitClub: 'CUIT del Club',
    montoCuotaGeneral: 'Monto Base Cuota',
    cuentaTitular: 'Titular de la Cuenta MP',
    cbuCvu: 'CBU / CVU',
    mpAccessToken: 'Access Token MP',
    mpPublicKey: 'Public Key MP'
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    // Detect changes
    const changes = [];
    Object.keys(settingsForm).forEach(key => {
      if (String(settingsForm[key]) !== String(clubSettings[key])) {
        const isSensitive = key === 'mpAccessToken' || key === 'mpPublicKey';
        changes.push({
          field: settingsFieldLabels[key] || key,
          oldValue: isSensitive ? maskToken(String(clubSettings[key])) : String(clubSettings[key]),
          newValue: isSensitive ? maskToken(String(settingsForm[key])) : String(settingsForm[key]),
        });
      }
    });
    if (changes.length === 0) {
      setEditingSettings(false);
      return;
    }
    setSettingsChanges(changes);
    setShowConfirmSettings(true);
  };

  const confirmSaveSettings = () => {
    const changeDetails = settingsChanges.map(c => `${c.field}: "${c.oldValue}" → "${c.newValue}"`).join(' | ');
    setClubSettings(settingsForm);
    registrarLog('modificacion_parametros', 'Modificación de parámetros del club', changeDetails);
    setShowConfirmSettings(false);
    setEditingSettings(false);
  };

  const maskToken = (token) => {
    if (!token || token.length < 12) return token || '(vacío)';
    return token.substring(0, 8) + '••••••••' + token.substring(token.length - 4);
  };

  const handleConfirmCashPayment = (e) => {
    e.preventDefault();
    if (!cashModalSocio) return;

    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto);
    setCashModalSocio(null);
  };

  const getLogTimestamp = (l) => {
    if (l.timestamp) return Number(l.timestamp);
    if (l.created_at) {
      const t = new Date(l.created_at).getTime();
      if (!isNaN(t)) return t;
    }
    if (l.id) {
      const match = String(l.id).match(/\d{10,}/);
      if (match) return parseInt(match[0], 10);
    }
    return 0;
  };

  const filteredLogs = logs
    .filter(l => {
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(l.tipoEvento)) {
        return false;
      }
      if (logSearch) {
        const q = logSearch.toLowerCase();
        return (
          (l.usuarioNombre && l.usuarioNombre.toLowerCase().includes(q)) ||
          (l.descripcion && l.descripcion.toLowerCase().includes(q)) ||
          (l.detalles && l.detalles.toLowerCase().includes(q)) ||
          (l.fechaHora && l.fechaHora.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => getLogTimestamp(b) - getLogTimestamp(a));

  const getEventBadgeStyle = (tipo) => {
    switch (tipo) {
      case 'comprobante_aprobado':
      case 'comprobante_aprobado_auto':
      case 'conciliacion_mp':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold';
      case 'comprobante_rechazado':
      case 'comprobante_rechazado_duplicado':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold';
      case 'comprobante_recibido':
      case 'comprobante_revision':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold';
      case 'pago_efectivo_coach':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-extrabold';
      case 'login_usuario':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold';
      case 'logout_usuario':
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/40 font-bold';
      case 'alta_usuario':
      case 'modificacion_usuario':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold';
      case 'modificacion_parametros':
        return 'bg-amber-600/20 text-amber-300 border border-amber-600/40 font-extrabold';
      case 'baja_usuario':
      case 'error_sistema':
        return 'bg-rose-950 text-rose-300 border border-rose-600 font-extrabold';
      case 'limpieza_logs':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { id: 'resumen', label: '📊 Dashboard Principal' },
            { id: 'logs', label: '📋 Logs & Auditoría de Eventos' },
            { id: 'configuracion', label: '⚙️ Parámetros del Club' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Resumen Principal (Solamente Tarjetas de Resumen 3D) */}
      {activeSubTab === 'resumen' && (
        <MainDashboardSummary 
          onNavigate={onNavigate} 
          onOpenModalUser={onOpenModalUser}
          onOpenModalStaff={onOpenModalStaff}
          onOpenModalEvent={onOpenModalEvent}
        />
      )}

      {/* Tab 2: Logs & Auditoría */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Historial Completo de Eventos y Auditoría
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro inalterable de inicios de sesión, cobranzas, escaneos OCR y operaciones del sistema (Formato 24hs).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar usuario, evento, N° op..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-xl font-medium"
                />
              </div>

              <button
                onClick={() => {
                  if (window.confirm("¿Estás seguro de vaciar todo el historial de auditoría?")) {
                    clearLogs();
                  }
                }}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
                title="Vaciar todo el historial de logs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vaciar
              </button>
            </div>
          </div>

          {/* Dropdown Event Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLogFilterOpen(!logFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedEventTypes.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtrar por Tipo de Evento
                {selectedEventTypes.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                    {selectedEventTypes.length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${logFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {logFilterOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950">
                    <span className="text-xs font-bold text-white">Tipos de Evento</span>
                    <button
                      onClick={() => {
                        if (selectedEventTypes.length === eventTypeOptions.length) {
                          setSelectedEventTypes([]);
                        } else {
                          setSelectedEventTypes(eventTypeOptions.map(o => o.id));
                        }
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {selectedEventTypes.length === eventTypeOptions.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  {/* Options */}
                  <div className="max-h-64 overflow-y-auto py-1">
                    {eventTypeOptions.map(opt => {
                      const isSelected = selectedEventTypes.includes(opt.id);
                      const count = logs.filter(l => l.tipoEvento === opt.id).length;
                      return (
                        <label
                          key={opt.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEventTypeFilter(opt.id)}
                            className="w-3.5 h-3.5 rounded border-slate-600 text-amber-500 focus:ring-amber-500/30 bg-slate-800"
                          />
                          <span className={`flex-1 text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {opt.label}
                          </span>
                          {count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${opt.color}`}>
                              {count}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950">
                    <button
                      onClick={() => { setSelectedEventTypes([]); setLogFilterOpen(false); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      Limpiar filtros
                    </button>
                    <span className="text-[10px] text-slate-500">
                      Mostrando {filteredLogs.length} de {logs.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active filter pills */}
            {selectedEventTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedEventTypes.map(typeId => {
                  const opt = eventTypeOptions.find(o => o.id === typeId);
                  if (!opt) return null;
                  return (
                    <span
                      key={typeId}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${opt.color}`}
                    >
                      {opt.label}
                      <button
                        onClick={() => toggleEventTypeFilter(typeId)}
                        className="hover:text-white ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Fecha y Hora</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 rounded-r-xl">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 font-mono whitespace-nowrap">{l.fechaHora}</td>
                    <td className="p-3 font-semibold">
                      <div className="text-white">{l.usuarioNombre}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{l.usuarioRol}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase shadow-sm ${getEventBadgeStyle(l.tipoEvento)}`}>
                        {l.tipoEvento.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-white">{l.descripcion}</td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">{l.detalles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Parámetros del Club */}
      {activeSubTab === 'configuracion' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Configuración General de Haedo Futsal
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Modificá los datos del club y la cuenta de Mercado Pago asociada. Los cambios requieren confirmación y quedan registrados en el log de auditoría.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* Section: Datos del Club */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                📋 Datos del Club
              </h4>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nombre del Club</label>
                <input 
                  type="text"
                  value={settingsForm.nombreClub}
                  onChange={(e) => setSettingsForm({...settingsForm, nombreClub: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">CUIT del Club</label>
                <input 
                  type="text"
                  value={settingsForm.cuitClub}
                  onChange={(e) => setSettingsForm({...settingsForm, cuitClub: e.target.value})}
                  placeholder="XX-XXXXXXXX-X"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Monto Base de Cuota Social ($)</label>
                <input 
                  type="number"
                  value={settingsForm.montoCuotaGeneral}
                  onChange={(e) => setSettingsForm({...settingsForm, montoCuotaGeneral: Number(e.target.value)})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                />
              </div>
            </div>

            {/* Section: Cuenta de Mercado Pago */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                💳 Cuenta de Mercado Pago
              </h4>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300/80">
                <strong>⚠️ Importante:</strong> Si cambiás la cuenta de Mercado Pago, asegurate de que los datos sean correctos. Los socios enviarán sus pagos a esta cuenta.
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Titular de la Cuenta MP</label>
                <input 
                  type="text"
                  value={settingsForm.cuentaTitular}
                  onChange={(e) => setSettingsForm({...settingsForm, cuentaTitular: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Alias de Mercado Pago (Recepción de Cuotas)</label>
                <input 
                  type="text"
                  value={settingsForm.aliasMercadoPago}
                  onChange={(e) => setSettingsForm({...settingsForm, aliasMercadoPago: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">CBU / CVU</label>
                <input 
                  type="text"
                  value={settingsForm.cbuCvu}
                  onChange={(e) => setSettingsForm({...settingsForm, cbuCvu: e.target.value})}
                  placeholder="0000000000000000000000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Section: API Mercado Pago */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                <span className="flex items-center gap-1.5"><Key className="w-3 h-3" /> Credenciales API Mercado Pago</span>
              </h4>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Access Token (Privado)</label>
                <div className="relative">
                  <input 
                    type={showTokenMP ? 'text' : 'password'}
                    value={settingsForm.mpAccessToken}
                    onChange={(e) => setSettingsForm({...settingsForm, mpAccessToken: e.target.value})}
                    placeholder="APP_USR-XXXX..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-rose-300 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenMP(!showTokenMP)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  >
                    {showTokenMP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Public Key</label>
                <input 
                  type="text"
                  value={settingsForm.mpPublicKey}
                  onChange={(e) => setSettingsForm({...settingsForm, mpPublicKey: e.target.value})}
                  placeholder="APP_USR-XXXX..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all"
            >
              Revisar y Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* Modal Confirmación de Cambios en Parámetros */}
      {showConfirmSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Confirmar Cambios en Parámetros
              </h3>
              <button onClick={() => setShowConfirmSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Estás por modificar <strong className="text-amber-300">{settingsChanges.length}</strong> parámetro{settingsChanges.length > 1 ? 's' : ''} del club. Revisá los cambios antes de confirmar:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {settingsChanges.map((change, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                  <div className="font-bold text-amber-300">{change.field}</div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-mono text-[11px] max-w-[45%] truncate">
                      {change.oldValue || '(vacío)'}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-[11px] max-w-[45%] truncate">
                      {change.newValue || '(vacío)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-[11px] text-slate-300">
              <strong className="text-amber-300">📝 Nota:</strong> Este cambio quedará registrado en el log de auditoría con tu nombre de usuario.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSettings(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSaveSettings}
                className="w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Confirmar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobro en Efectivo por Coach/Admin */}
      {cashModalSocio && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Cobrar Cuota en Efectivo
              </h3>
              <button onClick={() => setCashModalSocio(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] font-semibold uppercase">Socio pagador:</div>
                <div className="font-extrabold text-white text-base mt-0.5">{cashModalSocio.nombre} {cashModalSocio.apellido}</div>
                <div className="text-[11px] text-amber-400 font-mono">N° Socio: #{cashModalSocio.numeroSocio} • Categoría: {cashModalSocio.categoria}</div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-slate-300 space-y-1">
                <div className="font-bold text-amber-300">Responsable que recibe el dinero:</div>
                <div className="text-white font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {currentUser.nombre} {currentUser.apellido} ({currentUser.rol.toUpperCase()})
                </div>
                <p className="text-[10px] text-slate-400">
                  El dinero quedará asentado en el log de auditoría bajo la custodia de este responsable.
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
                <label className="block text-slate-400 mb-1 font-semibold">Concepto / Período</label>
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
