import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Sparkles, X, Share, Bell, CheckCircle2, Smartphone } from 'lucide-react';

export const PWAInstallBanner = () => {
  const { currentUser, registerPushSubscription } = useApp();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('App Haedo Futsal instalada con éxito');
      }
      setDeferredPrompt(null);
    } else {
      // Si el navegador no emitió el evento automático, abrir guía alternativa de 1 clic
      setShowGuideModal(true);
    }
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

  if (dismissed) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-amber-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg text-white space-y-3">
        
        {/* 1. SECCIÓN PRINCIPAL: INSTALAR APP */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-[52px] h-[52px] flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-amber-400/30 bg-slate-950">
                <img src="/logo.png?v=clean-20260726" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Haedo Futsal App</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    Oficial
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  {isIOS ? '¡Instalá la App en tu iPhone!' : 'Instalá la aplicación en tu celular.'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleInstall}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 font-black" />
              ¡Instalar App!
            </button>

            {pushStatus === 'default' && (
              <button
                onClick={handleEnablePush}
                disabled={pushActivating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                {pushActivating ? 'Activando...' : '🔔 Alertas Push'}
              </button>
            )}
          </div>
        </div>

        {pushSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ¡Notificaciones Push activadas en este dispositivo!
          </div>
        )}
      </div>

      {/* Modal Guía Alternativa de Instalación */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Cómo Instalar Haedo Futsal en tu Celular
              </h3>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Instala la App oficial para acceder directo desde tu pantalla de inicio y compartir comprobantes desde tu billetera virtual:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">🤖 En Android (Chrome / Edge / Brave):</div>
                <p className="text-slate-400">
                  Toca los <strong>3 puntos verticales</strong> (arriba a la derecha en tu navegador) y selecciona <strong>"Añadir a la pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-sky-300">🍎 En iPhone / iOS (Safari):</div>
                <p className="text-slate-400">
                  Toca el botón <strong>Compartir</strong> (📤 abajo en Safari) y selecciona <strong>"Agregar al inicio"</strong> (➕).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
