import React, { useState, useRef } from 'react';
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
  MessageCircle,
  AlertTriangle,
  Edit2,
  Save,
  Key,
  Check,
  Camera,
  Upload
} from 'lucide-react';

export const ModalFichaSocio = ({ socio, onClose, onOpenCashModal }) => {
  const { deleteUser, addOrUpdateUser, registrarLog, payments, currentUser } = useApp();
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const currentPhoto = socio?.fotoRostro || socio?.fotoUrl || socio?.foto || '';

  const [editForm, setEditForm] = useState({
    nombre: socio?.nombre || socio?.nombres || '',
    apellido: socio?.apellido || '',
    dni: socio?.dni || socio?.documentoDni || socio?.numeroDni || '',
    telefono: socio?.telefono || '',
    categoria: socio?.categoria || '',
    clave: socio?.clave || '1234',
    rol: socio?.rol || 'socio',
    estadoCuota: socio?.estadoCuota || 'al_dia',
    montoCuota: socio?.montoCuota || 15000,
    fotoUrl: currentPhoto,
    fechaNacimiento: socio?.fechaNacimiento || '',
    hinchaDe: socio?.hinchaDe || '',
    nombreContacto: socio?.nombreContacto || '',
    telefonoContacto: socio?.telefonoContacto || ''
  });

  if (!socio) return null;

  const nombreCompleto = `${socio.nombre || socio.nombres || 'Usuario'} ${socio.apellido || ''}`.trim();
  const isSocioRole = socio.rol === 'socio';

  // Format phone for WhatsApp link
  const getWhatsAppLink = (phoneStr) => {
    if (!phoneStr) return null;
    const cleanNum = phoneStr.replace(/\D/g, '');
    if (cleanNum.length < 8) return null;
    const formatted = cleanNum.startsWith('54') ? cleanNum : `549${cleanNum}`;
    return `https://wa.me/${formatted}`;
  };

  const waLink = getWhatsAppLink(socio.telefono);
  const waContactLink = getWhatsAppLink(socio.telefonoContacto);
  const socioPayments = payments.filter(p => p.socioId === socio.id || String(p.numeroSocio) === String(socio.numeroSocio));

  const handleDeleteSocio = () => {
    deleteUser(socio.id);
    setShowConfirmDelete(false);
    onClose();
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedSocio = {
      ...socio,
      ...editForm,
      montoCuota: Number(editForm.montoCuota)
    };

    addOrUpdateUser(updatedSocio);
    
    if (registrarLog) {
      registrarLog(
        'modificacion_usuario',
        `Datos de ${updatedSocio.nombre} ${updatedSocio.apellido} modificados`,
        `Modificación realizada desde Ficha Personal por ${currentUser?.nombre || 'Admin'}`,
        updatedSocio
      );
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1200);
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

  const handleUpdatePhoto = async (newPhotoBase64) => {
    if (!newPhotoBase64) return;
    const updatedSocio = {
      ...socio,
      ...editForm,
      fotoRostro: newPhotoBase64,
      fotoUrl: newPhotoBase64,
      foto: newPhotoBase64
    };
    setEditForm(prev => ({ ...prev, fotoUrl: newPhotoBase64 }));
    await addOrUpdateUser(updatedSocio);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      handleUpdatePhoto(evt.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn('Error accediendo a la cámara:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 400, 400);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    handleUpdatePhoto(dataUrl);
  };

  const canManage = currentUser?.rol === 'admin' || currentUser?.rol === 'coach' || currentUser?.rol === 'contador';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Modal de Cámara Web para tomar foto */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-white font-bold text-sm flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" /> Tomar Foto del Socio
            </h3>
            <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-black border-2 border-amber-400 shadow-xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Camera className="w-4 h-4" /> Capturar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-slate-200 my-auto">
        
        {/* Top Header Card with Banner */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-6 border-b border-slate-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10 cursor-pointer"
            title="Cerrar Ficha"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Foto / Avatar con opción de actualizar para Coach/Contador/Admin */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-800 border-2 border-amber-500/40 p-1 overflow-hidden shadow-xl flex items-center justify-center relative">
                {currentPhoto ? (
                  <img 
                    src={currentPhoto} 
                    alt={nombreCompleto} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-extrabold text-3xl">
                    {(editForm.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Overlay de Edición de Foto para Roles de Gestión */}
                {canManage && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer p-1">
                    <button
                      onClick={startCamera}
                      className="px-2 py-1 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-amber-400 w-full justify-center"
                      title="Tomar Foto con Cámara"
                    >
                      <Camera className="w-3 h-3" /> Cámara
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-slate-700 w-full justify-center"
                      title="Subir archivo de imagen"
                    >
                      <Upload className="w-3 h-3" /> Archivo
                    </button>
                  </div>
                )}
              </div>

              {/* Botón flotante siempre visible para cambiar foto en móviles/touch */}
              {canManage && (
                <div className="absolute -top-1.5 -left-1.5 flex gap-1 z-10">
                  <button
                    onClick={startCamera}
                    className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-lg border border-amber-300 transition-transform hover:scale-110 cursor-pointer"
                    title="Tomar nueva foto del socio"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 transition-transform hover:scale-110 cursor-pointer"
                    title="Subir foto desde archivo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow">
                #{socio.numeroSocio || 'ID'}
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
                <span className="text-white uppercase font-black">{editForm.apellido}</span>, {(editForm.nombre || '').split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')}
              </h2>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-amber-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  {editForm.categoria || 'General'}
                </span>
                {editForm.dni && (
                  <span className="text-slate-400 font-mono">
                    DNI: {editForm.dni}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">

          {saveSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 p-3 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
              <Check className="w-4 h-4" /> ¡Datos modificados y guardados con éxito!
            </div>
          )}

          {/* EDIT FORM MODE */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="bg-slate-950 border border-amber-500/30 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Edit2 className="w-4 h-4" /> Formulario de Edición de Usuario / Socio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nombre</label>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Apellido</label>
                  <input
                    type="text"
                    value={editForm.apellido}
                    onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">DNI</label>
                  <input
                    type="text"
                    value={editForm.dni}
                    onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Categoría / Disciplina</label>
                  <input
                    type="text"
                    value={editForm.categoria}
                    onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">PIN de Acceso (4 dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editForm.clave}
                    onChange={(e) => setEditForm({ ...editForm, clave: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-900 border border-slate-700 text-amber-400 rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none font-mono tracking-widest text-center"
                  />
                </div>

                {isSocioRole && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Estado de Cuota</label>
                    <select
                      value={editForm.estadoCuota}
                      onChange={(e) => setEditForm({ ...editForm, estadoCuota: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="al_dia">Al Día</option>
                      <option value="pendiente">En Revisión</option>
                      <option value="moroso">Moroso / Pendiente</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">URL de Fotografía</label>
                  <input
                    type="text"
                    value={editForm.fotoUrl}
                    onChange={(e) => setEditForm({ ...editForm, fotoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Datos Personales y de Contacto */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <User className="w-4 h-4 text-amber-400" /> Datos Personales y Contacto
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nombre de Usuario:</span>
                    <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      @{socio.usuario || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Documento DNI:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {socio.dni || (socio.id && socio.id.includes('-') ? socio.id.split('-').pop() : socio.id) || 'Sin registrar'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">N° de Socio / ID:</span>
                    <span className="font-bold text-amber-400">#{socio.numeroSocio || 'S/N'}</span>
                  </div>

                  {socio.fechaNacimiento && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> Nacimiento:
                      </span>
                      <span className="font-mono text-slate-200">{socio.fechaNacimiento}</span>
                    </div>
                  )}

                  {socio.hinchaDe && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Hincha de:
                      </span>
                      <span className="font-semibold text-amber-300">{socio.hinchaDe}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-900">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Teléfono / WA Socio:
                    </span>
                    {(socio.telefono || (socio.apellido && socio.apellido.includes(' | Tel: ') ? socio.apellido.split(' | Tel: ')[1] : null)) ? (
                      (() => {
                        const telStr = socio.telefono || socio.apellido.split(' | Tel: ')[1];
                        const waFormatted = `https://wa.me/${telStr.replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!54)/, '549')}`;
                        return (
                          <a
                            href={waFormatted}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded transition-all"
                            title="Enviar WhatsApp al socio"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" /> {telStr}
                          </a>
                        );
                      })()
                    ) : (
                      <span className="text-slate-600 italic">No especificado</span>
                    )}
                  </div>

                  {(socio.nombreContacto || socio.telefonoContacto) && (
                    <div className="pt-1.5 border-t border-slate-900 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Contacto de Emergencia / Familiar:</div>
                      {socio.nombreContacto && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Nombre Tutor/Contacto:</span>
                          <span className="font-bold text-slate-200">{socio.nombreContacto}</span>
                        </div>
                      )}
                      {socio.telefonoContacto && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" /> Teléfono Familiar / WA:
                          </span>
                          {waContactLink ? (
                            <a
                              href={waContactLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded transition-all"
                              title="Enviar WhatsApp al contacto de emergencia"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-400" /> {socio.telefonoContacto}
                            </a>
                          ) : (
                            <span className="text-slate-200">{socio.telefonoContacto}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {canManage && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-amber-400" /> PIN Acceso (4 dígitos):
                      </span>
                      <span className="font-mono text-amber-400 font-bold tracking-widest">
                        {(socio.clave || '1234').toString().slice(0, 4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Estado de Cuenta Corriente */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> Estado de Cuenta / Rol
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Disciplina / Categoría:</span>
                    <span className="font-bold text-amber-300 text-right">{socio.categoria || 'General'}</span>
                  </div>

                  {isSocioRole && (
                    <>
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
                    </>
                  )}

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
          )}

          {/* Historial de Comprobantes del Socio */}
          {isSocioRole && !isEditing && (
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
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canManage && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Modificar Datos
              </button>
            )}

            {canManage && !isEditing && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Dar de Baja
              </button>
            )}
          </div>

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
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">¿Confirmar Baja del Usuario?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer de forma accidental.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 text-[11px] font-semibold">Usuario a eliminar:</div>
              <div className="font-extrabold text-white text-base">{nombreCompleto}</div>
              <div className="text-amber-400 font-mono text-[11px]">Usuario: @{socio.usuario} • Categoría: {socio.categoria}</div>
            </div>

            <p className="text-xs text-slate-300">
              Al confirmar, el usuario perderá el acceso a la aplicación y su ficha quedará desactivada.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSocio}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
