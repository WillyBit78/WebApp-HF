import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Sparkles, X, Share, Bell, CheckCircle2 } from 'lucide-react';

export const PWAInstallBanner = () => {
  const { currentUser, registerPushSubscription } = useApp();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Push Permission State
  const [pushStatus, setPushStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission; // 'default' | 'granted' | 'denied'
    }
    return 'unsupported';
  });
  const [pushActivating, setPushActivating] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (iosDevice && !isStandalone) {
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
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App Haedo Futsal instalada con éxito');
    }
    setDeferredPrompt(null);
  };

  const handleEnablePush = async () => {
    setPushActivating(true);
    try {
      const result = await registerPushSubscription(currentUser, true);
      if (result && result.success) {
        setPushStatus('granted');
        setPushSuccess(true);
        setTimeout(() => setPushSuccess(false), 4000);
      } else if (result && result.reason === 'denied') {
        setPushStatus('denied');
        alert('⚠️ Las notificaciones están bloqueadas en tu navegador. Para activarlas, ve a Configuración del Navegador > Permisos > Notificaciones.');
      }
    } catch (e) {
      console.warn('Error activando push:', e);
    } finally {
      setPushActivating(false);
    }
  };

  // Condition to show PWA Install Banner or Push Notification Banner
  const needsPushPrompt = currentUser && pushStatus === 'default';
  const needsPwaPrompt = !dismissed && (deferredPrompt || isIOS);

  if (dismissed) return null;
  if (!needsPushPrompt && !needsPwaPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-amber-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg text-white animate-bounce-short space-y-3">
      
      {/* 1. SECCIÓN PRINCIPAL: ALERTA PUSH (SI NO ESTÁ OTORGADO EL PERMISO) */}
      {needsPushPrompt ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[50px] h-[50px] flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-purple-500/40 bg-purple-500/20 text-purple-300">
                <Bell className="w-6 h-6 animate-pulse text-amber-400" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5 text-white">
                  <span>Alertas del Club en tu Celular</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    Importante
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  Recibe avisos de partidos, entrenamientos y cuotas incluso con la app cerrada.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setDismissed(true)} 
              className="text-slate-400 hover:text-white p-1"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleEnablePush}
            disabled={pushActivating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {pushActivating ? 'Activando Notificaciones...' : '🔔 ¡Activar Alertas Push en este Celular!'}
          </button>
        </div>
      ) : (
        /* 2. SECCIÓN PWA INSTALL */
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[60px] h-[60px] flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-amber-400/30 bg-slate-950">
                <img src="/logo.png?v=clean-20260726" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Haedo Futsal App</span>
                  <span className="text-amber-400 font-bold tracking-wider" style={{ fontFamily: "'Caveat', cursive", fontSize: '0.96rem' }}>
                    Oficial
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {isIOS ? '¡Instalá la App en tu iPhone en 2 pasos!' : 'Instala la aplicación en tu celular en 1 clic.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setDismissed(true)} 
              className="text-slate-400 hover:text-white p-1"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isIOS ? (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-[11px] space-y-1 text-slate-200">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Share className="w-4 h-4" /> Pasos para iPhone (Safari):
              </div>
              <p>1. Tocá el botón <strong>Compartir</strong> (📤) abajo en Safari.</p>
              <p>2. Seleccioná <strong>'Agregar a Inicio'</strong> (➕).</p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 font-black" />
              ¡Instalar App Ahora!
            </button>
          )}
        </div>
      )}

      {pushSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ¡Notificaciones Push activadas en este dispositivo!
        </div>
      )}
    </div>
  );
};
