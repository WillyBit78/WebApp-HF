import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  ShieldAlert
} from 'lucide-react';

export const DashboardAdmin = ({ onOpenModalUser, onOpenModalEvent }) => {
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
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('resumen'); // 'resumen' | 'logs' | 'configuracion'
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState(clubSettings);

  // Filters for Audit Logs
  const [logFilterTipo, setLogFilterTipo] = useState('todos');
  const [logSearch, setLogSearch] = useState('');

  // Cash payment modal state for socio
  const [cashModalSocio, setCashModalSocio] = useState(null);
  const [cashMonto, setCashMonto] = useState(15000);
  const [cashConcepto, setCashConcepto] = useState('Pago de cuota social mensual en efectivo');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setClubSettings(settingsForm);
    setEditingSettings(false);
  };

  const handleConfirmCashPayment = (e) => {
    e.preventDefault();
    if (!cashModalSocio) return;

    registrarPagoEfectivoCoach(cashModalSocio.id, cashMonto, cashConcepto);
    setCashModalSocio(null);
  };

  const filteredLogs = logs.filter(l => {
    if (logFilterTipo !== 'todos' && l.tipoEvento !== logFilterTipo) return false;
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return (
        l.usuarioNombre.toLowerCase().includes(q) ||
        l.descripcion.toLowerCase().includes(q) ||
        l.detalles.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recaudado */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Balance General Club</span>
              <div className="text-2xl font-extrabold text-white mt-1">
                ${stats.balanceGeneralTotal.toLocaleString('es-AR')}
              </div>
              <span className="text-[11px] text-emerald-400/80 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Balances auditados en tiempo real
              </span>
            </div>
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Socios */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Padrón de Socios</span>
              <div className="text-2xl font-extrabold text-white mt-1">{stats.totalSocios}</div>
              <span className="text-[11px] text-slate-400 mt-1 block">7 Categorías activas</span>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Cuotas al Día vs Pendientes */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Estado de Cuotas</span>
              <div className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
                <span className="text-emerald-400">{stats.sociosAlDiaCount} al día</span>
                <span className="text-slate-600">/</span>
                <span className="text-amber-400">{stats.sociosPendientesCount + stats.sociosMorososCount} pend.</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Cuota base: ${clubSettings.montoCuotaGeneral.toLocaleString('es-AR')}</span>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Auditoría Pendiente */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Comprobantes Mercado Pago</span>
              <div className="text-2xl font-extrabold text-purple-300 mt-1">
                {stats.pagosPendientesRev.length} <span className="text-xs font-normal text-slate-400">por revisar</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Actualizaciones automáticas</span>
            </div>
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { id: 'resumen', label: 'Control de Socios' },
            { id: 'logs', label: '📋 Logs & Auditoría de Eventos' },
            { id: 'configuracion', label: 'Parámetros del Club' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onOpenModalUser}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/10"
          >
            <Plus className="w-4 h-4" /> Nuevo Socio
          </button>
        </div>
      </div>

      {/* Tab 1: Resumen de Socios */}
      {activeSubTab === 'resumen' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Padrón de Socios y Staff
            </h3>

            <button
              onClick={onOpenModalUser}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Nuevo Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Socio / Usuario</th>
                  <th className="p-3">DNI / N° Socio</th>
                  <th className="p-3">Categoría / Rol</th>
                  <th className="p-3">Estado Cuota</th>
                  <th className="p-3 text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs border border-slate-700">
                        {u.nombre.charAt(0)}
                      </div>
                      <div>
                        <div>{u.nombre} {u.apellido}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{u.email || u.telefono || 'Sin datos de contacto'}</div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      <div>DNI: {u.dni}</div>
                      <div className="text-[10px] text-amber-400 font-semibold">Socio #{u.numeroSocio}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.categoria}</div>
                      <span className="text-[10px] text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        u.estadoCuota === 'al_dia' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        u.estadoCuota === 'pendiente' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {u.estadoCuota === 'al_dia' ? 'Al Día' : u.estadoCuota === 'pendiente' ? 'En Revisión' : 'Moroso'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCashModalSocio(u)}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Cobrar cuota en efectivo por Coach/Admin"
                        >
                          <Banknote className="w-3.5 h-3.5" /> Efectivo
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de dar de baja al socio ${u.nombre} ${u.apellido}?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                Registro inalterable de inicios de sesión, cobranzas, escaneos OCR y operaciones del sistema.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar en logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-xl font-medium"
                />
              </div>

              <select
                value={logFilterTipo}
                onChange={(e) => setLogFilterTipo(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-xl font-medium"
              >
                <option value="todos">Todos los eventos</option>
                <option value="alta_usuario">Altas de Usuario</option>
                <option value="baja_usuario">Bajas de Usuario</option>
                <option value="pago_efectivo_coach">Pagos en Efectivo (Coach)</option>
                <option value="comprobante_recibido">Comprobantes Recibidos</option>
                <option value="comprobante_aprobado">Comprobantes Aprobados</option>
                <option value="comprobante_rechazado">Comprobantes Rechazados</option>
                <option value="comprobante_rechazado_duplicado">Duplicados Rechazados</option>
                <option value="error_sistema">Errores de Sistema</option>
                <option value="ingreso_manual">Ingresos Manuales</option>
                <option value="gasto_manual">Gastos Manuales</option>
              </select>

              <button
                onClick={() => {
                  if (window.confirm("¿Estás seguro de vaciar todo el historial de auditoría?")) {
                    clearLogs();
                  }
                }}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vaciar
              </button>
            </div>
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
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Configuración General de Haedo Futsal
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Nombre del Club</label>
              <input 
                type="text"
                value={settingsForm.nombreClub}
                onChange={(e) => setSettingsForm({...settingsForm, nombreClub: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Alias de Mercado Pago (Recepción de Cuotas)</label>
              <input 
                type="text"
                value={settingsForm.aliasMercadoPago}
                onChange={(e) => setSettingsForm({...settingsForm, aliasMercadoPago: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Titular de la Cuenta MP</label>
              <input 
                type="text"
                value={settingsForm.cuentaTitular}
                onChange={(e) => setSettingsForm({...settingsForm, cuentaTitular: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Monto Base de Cuota Social ($)</label>
              <input 
                type="number"
                value={settingsForm.montoCuotaGeneral}
                onChange={(e) => setSettingsForm({...settingsForm, montoCuotaGeneral: Number(e.target.value)})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-red-500/20"
            >
              Guardar Cambios
            </button>
          </form>
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
