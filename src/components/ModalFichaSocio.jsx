import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Shield, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Banknote, 
  Trash2, 
  Award, 
  ExternalLink,
  MessageCircle,
  Hash,
  AlertTriangle
} from 'lucide-react';

export const ModalFichaSocio = ({ socio, onClose, onOpenCashModal }) => {
  const { deleteUser, payments, currentUser } = useApp();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!socio) return null;

  const nombreCompleto = `${socio.nombre || socio.nombres || 'Socio'} ${socio.apellido || ''}`.trim();
  const isSocioRole = socio.rol === 'socio';

  // Format phone for WhatsApp link (Argentina 549...)
  const getWhatsAppLink = (phoneStr) => {
    if (!phoneStr) return null;
    const cleanNum = phoneStr.replace(/\D/g, '');
    if (cleanNum.length < 8) return null;
    const formatted = cleanNum.startsWith('54') ? cleanNum : `549${cleanNum}`;
    return `https://wa.me/${formatted}`;
  };

  const waLink = getWhatsAppLink(socio.telefono);

  // Socio payments history
  const socioPayments = payments.filter(p => p.socioId === socio.id || String(p.numeroSocio) === String(socio.numeroSocio));

  const handleDeleteSocio = () => {
    deleteUser(socio.id);
    setShowConfirmDelete(false);
    onClose();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'al_dia':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Al Día
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Clock className="w-3.5 h-3.5" /> En Revisión
          </span>
        );
      case 'moroso':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" /> Moroso / Pendiente
          </span>
        );
    }
  };

  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'coach' || currentUser?.rol === 'contador';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-slate-200 my-auto">
        
        {/* Top Header Card with Banner */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-6 border-b border-slate-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
            title="Cerrar Ficha"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Foto / Avatar del Socio */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-800 border-2 border-amber-500/40 p-1 overflow-hidden shadow-xl flex items-center justify-center">
                {socio.fotoUrl || socio.foto ? (
                  <img 
                    src={socio.fotoUrl || socio.foto} 
                    alt={nombreCompleto} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-extrabold text-3xl">
                    {nombreCompleto.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow">
                #{socio.numeroSocio || 'SOCIO'}
              </span>
            </div>

            {/* Main Info Header */}
            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Rol: {socio.rol?.toUpperCase()}
                </span>
                {isSocioRole && getStatusBadge(socio.estadoCuota)}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {nombreCompleto}
              </h2>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-amber-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  {socio.categoria || 'Sin Categoría'}
                </span>
                {socio.dni && (
                  <span className="text-slate-400 font-mono">
                    DNI: {socio.dni}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

          {/* Grid Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Datos Personales y de Contacto */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <User className="w-4 h-4 text-amber-400" /> Datos Personales y Contacto
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nombre de Usuario:</span>
                  <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {socio.usuario || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Documento DNI:</span>
                  <span className="font-mono text-slate-200">{socio.dni || 'Sin registrar'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">N° de Socio:</span>
                  <span className="font-bold text-amber-400">#{socio.numeroSocio || 'S/N'}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono / WA:
                  </span>
                  {socio.telefono ? (
                    waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded transition-all"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" /> {socio.telefono}
                      </a>
                    ) : (
                      <span className="text-slate-200">{socio.telefono}</span>
                    )
                  ) : (
                    <span className="text-slate-600 font-italic">No especificado</span>
                  )}
                </div>

                {socio.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> Email:
                    </span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">{socio.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Estado de Cuenta Corriente */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Estado de Cuotas Social
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Disciplina / Categoría:</span>
                  <span className="font-bold text-amber-300 text-right">{socio.categoria || 'General'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Monto Cuota Mensual:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${(socio.montoCuota || 15000).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estado de Pago:</span>
                  {getStatusBadge(socio.estadoCuota)}
                </div>

                {onOpenCashModal && isSocioRole && canManage && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCashModal(socio);
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Banknote className="w-4 h-4" /> Cobrar Cuota en Efectivo
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Historial de Comprobantes del Socio */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Clock className="w-4 h-4 text-amber-400" /> Historial de Pagos y Comprobantes
            </h3>

            {socioPayments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {socioPayments.map((p, idx) => (
                  <div 
                    key={p.id || idx} 
                    className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">N° Op: {p.numeroOperacion || 'Cobro Efectivo'}</div>
                      <div className="text-[10px] text-slate-400">{p.fechaTransferencia || p.fechaHora || 'Reciente'} • {p.billeteraOrigen || 'Efectivo'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400">${Number(p.monto || 0).toLocaleString('es-AR')}</div>
                      <span className={`text-[10px] font-bold uppercase ${p.estado === 'aprobado' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {p.estado === 'aprobado' ? 'Aprobado' : 'En revisión'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-3">
                No hay comprobantes de pago registrados para este socio aún.
              </p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          {canManage && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Dar de Baja
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>

      {/* Confirmation Modal for Deleting Socio */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">¿Confirmar Baja de Socio?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer de forma accidental.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 text-[11px] font-semibold">Socio a eliminar:</div>
              <div className="font-extrabold text-white text-base">{nombreCompleto}</div>
              <div className="text-amber-400 font-mono text-[11px]">N° Socio: #{socio.numeroSocio} • Categoría: {socio.categoria}</div>
            </div>

            <p className="text-xs text-slate-300">
              Al confirmar, el usuario perderá el acceso a la aplicación y su padrón quedará desactivado.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSocio}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar Socio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
