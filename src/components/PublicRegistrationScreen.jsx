import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateUniqueUsername } from '../utils/usernameGenerator';
import { 
  UserCheck, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Trophy, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  ExternalLink,
  Lock,
  Phone,
  User,
  Heart,
  Calendar,
  Sparkles
} from 'lucide-react';

export const DISCIPLINAS_CONFIG = [
  {
    id: 'baby',
    nombre: 'Futbol Baby',
    tipo: 'dupla',
    monto: 30000,
    etiquetaModalidad: 'Infantil',
    categorias: {
      'EDEFI Baby': ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020']
    }
  },
  {
    id: 'futsal_masculino',
    nombre: 'Futsal Masculino',
    tipo: 'dupla',
    monto: 30000,
    etiquetaModalidad: 'Juvenil / Adulto',
    categorias: {
      'FUTSALA Promo': ['2016', '2017', '2018'],
      'FUTSALA Masculino': ['1ra', '3ra', '4ta', '5ta', '6ta', '7ma', '8va'],
      'BAFI Masculino': ['1ra', 'Reserva', '3ra', '4ta', '5ta']
    }
  },
  {
    id: 'futsal_femenino',
    nombre: 'Futsal Femenino',
    tipo: 'unica',
    monto: 20000,
    etiquetaModalidad: 'Disciplina Única',
    categorias: {
      'BAFI Femenino': ['1ra', 'Reserva']
    }
  },
  {
    id: 'futsal_mayores',
    nombre: 'Futsal Mayores',
    tipo: 'unica',
    monto: 15000,
    etiquetaModalidad: 'Disciplina Única (+30/+35/+42)',
    categorias: {
      'EDEFI Mayores': ['+30', '+35', '+42']
    }
  }
];

export const PublicRegistrationScreen = ({ onBackToLogin, isModal = false, onCloseModal }) => {
  const { users, addOrUpdateUser, login } = useApp();

  const [step, setStep] = useState(1); // 1: DNI, 2: Datos Personales & Cam, 3: Disciplinas, 4: Exito

  // DNI step state
  const [dniInput, setDniInput] = useState('');
  const [existingUserFound, setExistingUserFound] = useState(null);
  const [existingPassword, setExistingPassword] = useState('');
  const [dniLoginError, setDniLoginError] = useState('');

  // Personal data step state
  const [formData, setFormData] = useState({
    apellido: '',
    nombres: '',
    fechaNacimiento: '',
    telefono: '',
    hinchaDe: 'Haedo Futsal',
    nombreContacto: '',
    telefonoContacto: '',
    fotoRostro: ''
  });

  // Camera state
  const [usingCamera, setUsingCamera] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Disciplines state
  const [selectedDiscIds, setSelectedDiscIds] = useState(['futsal_masculino']);
  const [selectedCategoryMap, setSelectedCategoryMap] = useState({
    'futsal_masculino': { madre: 'FUTSALA Masculino', sub: '1ra' }
  });

  // Registered result
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Formato DNI 88.888.888
  const formatDNI = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  };


  // Formato Nombres: Formato Título
  const formatNombres = (val) => {
    return val
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Formato Fecha DD/MM/AAAA
  const formatFecha = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
  };

  // Formato Teléfono
  const formatTelefono = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 13);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 2)} ${raw.slice(2)}`;
    return `${raw.slice(0, 2)} ${raw.slice(2, 6)}-${raw.slice(6)}`;
  };

  const checkDniMatch = (inputVal) => {
    const cleanDni = (inputVal || '').replace(/\D/g, '').replace(/^0+/, '');
    if (cleanDni.length < 6) return null;
    return users.find(u => {
      const uDni = String(u.dni || u.documentoDni || u.numeroDni || u.documento || '').replace(/\D/g, '').replace(/^0+/, '');
      return Boolean(uDni && uDni === cleanDni);
    });
  };

  const handleDniChange = (e) => {
    const formatted = formatDNI(e.target.value);
    setDniInput(formatted);
    const found = checkDniMatch(formatted);
    if (found) {
      setExistingUserFound(found);
    } else {
      setExistingUserFound(null);
    }
  };

  // Verificar DNI (Primary Key Única)
  const handleCheckDni = (e) => {
    if (e) e.preventDefault();
    const cleanDni = dniInput.replace(/\D/g, '').replace(/^0+/, '');
    if (cleanDni.length < 6) return;

    const found = checkDniMatch(dniInput);
    if (found) {
      setExistingUserFound(found);
      // BLOQUEADO: No se permite avanzar al formulario si el DNI ya existe en el padrón
      return;
    }

    setExistingUserFound(null);
    setFormData(prev => ({ ...prev, dni: dniInput }));
    setStep(2);
  };

  // Login para socio con DNI existente
  const handleLoginExistingUser = (e) => {
    e.preventDefault();
    setDniLoginError('');
    const success = login(existingUserFound.usuario, existingPassword);
    if (success) {
      if (onCloseModal) onCloseModal();
      else if (onBackToLogin) onBackToLogin();
    } else {
      setDniLoginError('Contraseña incorrecta. Por favor reintentá.');
    }
  };

  // Manejo de Cámara HTML5
  const startCamera = async () => {
    try {
      setUsingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("No se pudo acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara del dispositivo. Podés subir una foto desde tus archivos.");
      setUsingCamera(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setUsingCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 320, 320);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData(prev => ({ ...prev, fotoRostro: dataUrl }));
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fotoRostro: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Manejo de Selección de Disciplinas
  const toggleDisciplina = (discId) => {
    const targetDisc = DISCIPLINAS_CONFIG.find(d => d.id === discId);
    if (!targetDisc) return;

    if (targetDisc.tipo === 'unica') {
      // Disciplina única -> reemplaza todo
      setSelectedDiscIds([discId]);
      const defaultCatMadre = Object.keys(targetDisc.categorias)[0];
      const defaultSub = targetDisc.categorias[defaultCatMadre][0];
      setSelectedCategoryMap({
        [discId]: { madre: defaultCatMadre, sub: defaultSub }
      });
      return;
    }

    // Disciplina Dupla (Baby o Futsal Masculino)
    if (selectedDiscIds.includes(discId)) {
      if (selectedDiscIds.length === 1) return; // Al menos 1 disciplina
      const nextIds = selectedDiscIds.filter(id => id !== discId);
      setSelectedDiscIds(nextIds);
    } else {
      // Filtrar cualquier disciplina única previa
      const currentDuplas = selectedDiscIds.filter(id => {
        const d = DISCIPLINAS_CONFIG.find(item => item.id === id);
        return d && d.tipo === 'dupla';
      });
      if (currentDuplas.length >= 2) return; // Máximo 2 disciplinas compatibles

      const nextIds = [...currentDuplas, discId];
      setSelectedDiscIds(nextIds);

      const defaultCatMadre = Object.keys(targetDisc.categorias)[0];
      const defaultSub = targetDisc.categorias[defaultCatMadre][0];
      setSelectedCategoryMap(prev => ({
        ...prev,
        [discId]: { madre: defaultCatMadre, sub: defaultSub }
      }));
    }
  };

  // Cálculo de Cuota Única (el valor más alto de las disciplinas seleccionadas)
  const calcularCuotaMensual = () => {
    if (selectedDiscIds.length === 0) return 15000;
    const montos = selectedDiscIds.map(id => {
      const d = DISCIPLINAS_CONFIG.find(item => item.id === id);
      return d ? d.monto : 0;
    });
    return Math.max(...montos);
  };

  const handleSubcategoryChange = (discId, catMadre, sub) => {
    setSelectedCategoryMap(prev => ({
      ...prev,
      [discId]: { madre: catMadre, sub }
    }));
  };

  // Enviar Formulario Final
  const handleSubmitRegistration = (e) => {
    e.preventDefault();

    // Generar Username único
    const uniqueUsername = generateUniqueUsername(formData.nombres, formData.apellido, users);
    
    // Construir string de categoría combinada
    const primaryDiscId = selectedDiscIds[0];
    const primaryMapping = selectedCategoryMap[primaryDiscId];
    const catString = primaryMapping 
      ? `${primaryMapping.madre} (${primaryMapping.sub})`
      : 'BAFI Femenino (1ra)';

    const cuotaFinal = calcularCuotaMensual();

    const newSocioObj = {
      nombre: formData.nombres,
      nombres: formData.nombres,
      apellido: formData.apellido,
      dni: dniInput,
      fechaNacimiento: formData.fechaNacimiento,
      telefono: formData.telefono,
      hinchaDe: formData.hinchaDe || 'Haedo Futsal',
      nombreContacto: formData.nombreContacto,
      telefonoContacto: formData.telefonoContacto,
      fotoRostro: formData.fotoRostro,
      usuario: uniqueUsername,
      clave: '1234',
      rol: 'socio',
      categoria: catString,
      disciplinas: selectedDiscIds,
      montoCuota: cuotaFinal,
      estadoCuota: 'pendiente'
    };

    addOrUpdateUser(newSocioObj);

    setCreatedCredentials({
      usuario: uniqueUsername,
      clave: '1234',
      nombre: `${formData.nombres} ${formData.apellido}`,
      cuota: cuotaFinal
    });

    setStep(4);
  };

  const copyAppShareLink = () => {
    const url = window.location.origin + window.location.pathname + '#registro';
    const shareText = `Haedo Futsal App\nInscribite en la App Oficial del Club!\n${url}`;
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative ${isModal ? 'py-2' : 'py-10'}`}>
      {/* Fondo Deportivo Animado */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.08),transparent_50%)] pointer-events-none"></div>

      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Header con Escudo */}
        <div className="text-center space-y-2 relative">
          {isModal && (
            <button
              onClick={onCloseModal}
              className="absolute right-0 top-0 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl text-xs font-bold"
            >
              ✕ Cerrar
            </button>
          )}

          <div className="w-20 h-20 mx-auto relative group">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse"></div>
            <img src="/logo.png?v=clean-20260726" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-xl relative z-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 text-brand-400 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Ficha de Inscripción Oficial de Socio
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            HAEDO FUTSAL <span className="text-amber-400">2026</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Formá parte de nuestra gran familia deportiva. Completá tus datos para obtener tu carnet y usuario.
          </p>
        </div>

        {/* Indicadores de Pasos */}
        {step < 4 && (
          <div className="flex items-center justify-between px-6 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step === i ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-110' :
                  step > i ? 'bg-emerald-500 text-slate-950 font-black' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {step > i ? '✓' : i}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:inline ${step === i ? 'text-white' : 'text-slate-500'}`}>
                  {i === 1 ? 'DNI' : i === 2 ? 'Datos' : 'Disciplinas'}
                </span>
                {i < 3 && <div className="w-8 sm:w-16 h-0.5 bg-slate-800 mx-1"></div>}
              </div>
            ))}
          </div>
        )}

        {/* PASO 1: VERIFICACIÓN DE DNI */}
        {step === 1 && (
          <form onSubmit={handleCheckDni} className="space-y-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
                Ingresá tu DNI para comenzar
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="88.888.888"
                  value={dniInput}
                  onChange={handleDniChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono font-bold tracking-widest outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
                <ShieldCheck className="w-5 h-5 text-slate-500 absolute right-4 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400">
                Verificamos si ya estás registrado en el sistema para evitar inscripciones duplicadas.
              </p>
            </div>

            {/* Alerta si el usuario DNI ya existe (PK) */}
            {existingUserFound && (
              <div className="bg-amber-500/10 border border-amber-500/40 p-4.5 rounded-2xl space-y-3.5 animate-fadeIn">
                <div className="flex items-start gap-2.5 text-amber-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white text-sm">¡DNI Ya Registrado en la App!</div>
                    <p className="text-slate-300">
                      Hola <strong>{existingUserFound.nombre} {existingUserFound.apellido}</strong>, tu DNI (<span className="font-mono text-amber-300">{dniInput}</span>) ya figura como clave única en el padrón oficial del club.
                    </p>
                    <div className="text-[11px] text-amber-400 font-mono pt-0.5">Usuario asignado: @{existingUserFound.usuario}</div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-amber-500/20 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">Ingresá tu PIN para acceder directamente:</label>
                  <input
                    type="password"
                    placeholder="PIN / Contraseña de acceso (Ej: 1234)"
                    value={existingPassword}
                    onChange={(e) => setExistingPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-400 font-mono tracking-widest"
                  />
                  {dniLoginError && <p className="text-[11px] text-rose-400 font-bold">{dniLoginError}</p>}
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleLoginExistingUser}
                      className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" /> Ingresar Ahora
                    </button>

                    {onBackToLogin && (
                      <button
                        type="button"
                        onClick={onBackToLogin}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Ir a Iniciar Sesión
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {onBackToLogin && (
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
              )}
              <button
                type="button"
                disabled={dniInput.replace(/\D/g, '').length < 6}
                onClick={handleCheckDni}
                className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer"
              >
                Continuar Formulario <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 2: DATOS PERSONALES & FOTO ROSTRO */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Apellido (SOLO LETRAS)</label>
                <input
                  type="text"
                  required
                  placeholder="LOPEZ"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold tracking-wide outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nombres (1 o 2 Nombres)</label>
                <input
                  type="text"
                  required
                  placeholder="Walter Javier"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: formatNombres(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fecha de Nacimiento</label>
                <input
                  type="text"
                  required
                  placeholder="DD/MM/AAAA"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: formatFecha(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  required
                  placeholder="11 1234-5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: formatTelefono(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* SECCIÓN CÁMARA / FOTO ROSTRO */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400" /> Foto del Rostro / Carnet
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Requisito obligatorio para el padrón</span>
              </div>

              {formData.fotoRostro ? (
                <div className="flex items-center gap-4">
                  <img src={formData.fotoRostro} alt="Selfie socio" className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Foto Capturada con Éxito
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fotoRostro: '' })}
                      className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Tomar otra foto
                    </button>
                  </div>
                </div>
              ) : usingCamera ? (
                <div className="space-y-3">
                  <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-black">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <Camera className="w-4 h-4" /> Tomar Foto Ahora
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-800 text-slate-400 px-3 py-2 rounded-xl text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" /> Abrir Cámara / Selfie
                  </button>
                  
                  <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all">
                    Subir Imagen
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* SECCIÓN CONTACTO ADICIONAL / HINCHA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">¿De qué club sos hincha?</label>
                <input
                  type="text"
                  placeholder="Ej: Haedo / Boca / River"
                  value={formData.hinchaDe}
                  onChange={(e) => setFormData({ ...formData, hinchaDe: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nombre de Contacto (Padre/Tutor)</label>
                <input
                  type="text"
                  placeholder="Nombre de contacto"
                  value={formData.nombreContacto}
                  onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Teléfono de Contacto Adicional</label>
              <input
                type="text"
                placeholder="Teléfono del adulto a cargo"
                value={formData.telefonoContacto}
                onChange={(e) => setFormData({ ...formData, telefonoContacto: formatTelefono(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.apellido || !formData.nombres) {
                    alert('Es obligatorio ingresar tu Apellido y Nombres completos.');
                    return;
                  }
                  if (!formData.fechaNacimiento || formData.fechaNacimiento.length < 10) {
                    alert('Es obligatorio ingresar la Fecha de Nacimiento (DD/MM/AAAA).');
                    return;
                  }
                  if (!formData.telefono) {
                    alert('Es obligatorio ingresar tu número de Teléfono / WhatsApp.');
                    return;
                  }
                  if (!formData.fotoRostro) {
                    alert('📸 Es obligatorio tomar o subir una foto del rostro para completar tu ficha de socio.');
                    return;
                  }
                  if (!formData.nombreContacto || !formData.telefonoContacto) {
                    alert('Es obligatorio completar el Nombre y Teléfono del contacto de emergencia.');
                    return;
                  }
                  setStep(3);
                }}
                className={`flex-1 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  (formData.apellido && formData.nombres && formData.fechaNacimiento && formData.telefono && formData.fotoRostro && formData.nombreContacto && formData.telefonoContacto)
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-400/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer'
                }`}
              >
                Siguiente: Disciplinas <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {(!formData.fotoRostro || !formData.telefono || !formData.fechaNacimiento) && (
              <p className="text-[11px] text-amber-400/90 text-center font-medium animate-pulse pt-1">
                ⚠️ Todos los campos son obligatorios (incluida la foto del rostro).
              </p>
            )}
          </div>
        )}

        {/* PASO 3: SELECCIÓN DE DISCIPLINAS Y CATEGORÍAS */}
        {step === 3 && (
          <form onSubmit={handleSubmitRegistration} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
                Elegí tu disciplina (Podés seleccionar hasta 2 compatibles)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DISCIPLINAS_CONFIG.map(disc => {
                  const isSelected = selectedDiscIds.includes(disc.id);
                  return (
                    <div
                      key={disc.id}
                      onClick={() => toggleDisciplina(disc.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 relative ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20 shadow-lg'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-white text-sm">{disc.nombre}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{disc.etiquetaModalidad}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECCIÓN DE CATEGORÍA Y SUBCATEGORÍA SEGÚN DISCIPLINAS ELEGIDAS */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Categoría y Sub-categoría Asignada
              </div>

              {selectedDiscIds.map(discId => {
                const disc = DISCIPLINAS_CONFIG.find(d => d.id === discId);
                if (!disc) return null;

                const currentMap = selectedCategoryMap[discId] || {
                  madre: Object.keys(disc.categorias)[0],
                  sub: disc.categorias[Object.keys(disc.categorias)[0]][0]
                };

                const subOptions = disc.categorias[currentMap.madre] || [];

                return (
                  <div key={discId} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-amber-400 uppercase">{disc.nombre}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Categoría Madre</label>
                        <select
                          value={currentMap.madre}
                          onChange={(e) => {
                            const newMadre = e.target.value;
                            const firstSub = disc.categorias[newMadre][0];
                            handleSubcategoryChange(discId, newMadre, firstSub);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 font-bold outline-none text-xs"
                        >
                          {Object.keys(disc.categorias).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Sub-categoría (Plantel)</label>
                        <select
                          value={currentMap.sub}
                          onChange={(e) => handleSubcategoryChange(discId, currentMap.madre, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 font-bold outline-none text-xs"
                        >
                          {subOptions.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar e Inscribirse
              </button>
            </div>
          </form>
        )}

        {/* PASO 4: REGISTRO EXITOSO & CREDENCIALES */}
        {step === 4 && createdCredentials && (
          <div className="space-y-5 text-center animate-fadeIn">
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">¡Bienvenido al Club, {createdCredentials.nombre}!</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tu inscripción ha sido registrada exitosamente en el padrón oficial de Haedo Futsal.
              </p>
            </div>

            {/* Tarjeta de Credenciales de Acceso */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-2xl border-2 border-amber-400/40 shadow-2xl space-y-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Credenciales de Acceso
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">USUARIO GENERADO:</span>
                  <span className="text-lg font-black text-amber-400 tracking-widest font-mono">{createdCredentials.usuario}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">CLAVE DE SEGURIDAD:</span>
                  <span className="text-base font-bold text-white tracking-widest font-mono">{createdCredentials.clave}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  login(createdCredentials.usuario, createdCredentials.clave);
                  if (onBackToLogin) onBackToLogin();
                  if (onCloseModal) onCloseModal();
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Ingresar a Mi Perfil
              </button>

              <button
                type="button"
                onClick={copyAppShareLink}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedLink ? '¡Link Copiado!' : 'Copiar Link de Inscripción Directo'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
