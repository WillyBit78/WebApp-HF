import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Share, PlusSquare } from 'lucide-react';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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

  if (dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg text-white animate-bounce-short">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-[60px] h-[60px] flex items-center justify-center shrink-0 overflow-hidden rounded-xl border border-amber-400/30 bg-slate-950">
            <img src="/logo.png?v=clean-20260726" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="font-extrabold text-sm flex items-center gap-1.5">
              <span>Haedo Futsal App</span>
              <span 
                className="text-amber-400 font-bold tracking-wider"
                style={{ 
                  fontFamily: "'Caveat', cursive", 
                  fontSize: '0.96rem',
                  lineHeight: '1'
                }}
              >
                Oficial
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isIOS 
                ? '¡Instalá la App en tu iPhone en 2 pasos!'
                : 'Instala la aplicación en tu celular en 1 clic.'
              }
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

      <div className="mt-3">
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
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4 font-black" />
            ¡Instalar App Ahora!
          </button>
        )}
      </div>
    </div>
  );
};
