import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, KeyRound, User, AlertCircle, Download, Sparkles, Share, PlusSquare, Smartphone } from 'lucide-react';

export const LoginScreen = ({ onOpenPublicRegister }) => {
  const { login } = useApp();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);
  const [devClicks, setDevClicks] = useState(0);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const iosDevice = /iphone|ipad|ipod/.test(userAgent);
      const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

      setIsStandalone(standalone);

      if (iosDevice && !standalone) {
        setIsIOS(true);
      }

      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSInstructions(prev => !prev);
      return;
    }

    if (!deferredPrompt) {
      alert('📱 Abrí esta página en Chrome o tu navegador móvil para instalar la App en tu pantalla de inicio.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App instalada desde la pantalla de login');
    }
    setDeferredPrompt(null);
  };

  const handleLogoClick = () => {
    const newClicks = devClicks + 1;
    setDevClicks(newClicks);
    if (newClicks >= 5) {
      if (window.confirm('🔧 MODO DESARROLLADOR: ¿Deseas purgar la base de datos local y reiniciar la app?')) {
        localStorage.clear();
        window.location.reload();
      }
      setDevClicks(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(false);
    
    if (!usuario.trim() || !clave.trim()) {
      setError(true);
      return;
    }

    const success = login(usuario.trim(), clave.trim());
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center mb-8">
          <div 
            onClick={handleLogoClick}
            className="w-48 h-48 flex items-center justify-center mb-4 cursor-pointer select-none active:scale-95 transition-transform"
          >
            <img src="/logo.png?v=clean-20260726" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-1.5">
            <span className="text-white font-bold">HAEDO</span>
            <span className="text-red-500 font-normal">FUTSAL</span>
          </h1>
          <p 
            className="text-white font-medium tracking-wider"
            style={{ 
              fontFamily: "'Caveat', cursive", 
              fontSize: '2.0rem',
              lineHeight: '1',
              textShadow: '0 0 8px #1d4ed8, 0 0 16px rgba(59, 130, 246, 0.8), 0 0 24px rgba(37, 99, 235, 0.6)'
            }}
          >
            más que un club
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Usuario o clave incorrectos.</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                  placeholder="Ej: PLOPEZ"
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all font-medium uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">PIN de 4 dígitos</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={clave}
                  onChange={(e) => setClave(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-xl tracking-[0.5em] font-black"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/25 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            Ingresar
          </button>

          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-center">
            <button
              type="button"
              onClick={onOpenPublicRegister}
              className="w-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              👥 ¿Sos Socio Nuevo? Inscribite acá
            </button>

            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                Instalar Haedo Futsal App
              </button>
            )}

            {/* iOS Instructions Dropdown */}
            {showIOSInstructions && isIOS && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left text-xs space-y-2 animate-fadeIn text-slate-200 mt-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Cómo instalar en tu iPhone:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Toca el botón <Share className="w-3.5 h-3.5 inline text-blue-400 mx-1" /> <strong>Compartir</strong> en Safari.</li>
                  <li>Desplázate hacia abajo y selecciona <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> <strong>"Agregar a Inicio"</strong>.</li>
                  <li>¡Listo! Abrí la app directamente desde tu pantalla principal.</li>
                </ol>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
