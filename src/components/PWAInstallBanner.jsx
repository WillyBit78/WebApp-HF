import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
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

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 border border-red-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg text-white animate-bounce-short">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo.png" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="font-extrabold text-sm flex items-center gap-1.5">
              <span>Haedo Futsal</span>
              <span 
                className="text-blue-900 font-bold tracking-wider"
                style={{ 
                  fontFamily: "'Caveat', cursive", 
                  fontSize: '0.96rem',
                  lineHeight: '1',
                  textShadow: '0 0 8px rgba(255,255,255,1), 0 0 12px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6)'
                }}
              >
                más que un club
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instala la aplicación en tu celular con 1 solo clic.
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

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Download className="w-4 h-4 font-black" />
          ¡Instalar App Ahora!
        </button>
      </div>
    </div>
  );
};
