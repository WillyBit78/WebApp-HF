import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Sparkles, X, Share, Smartphone, Bell } from 'lucide-react';

export const PWAInstallBanner = () => {
  const { currentUser, registerPushSubscription } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasPushPermission, setHasPushPermission] = useState(false);

  useEffect(() => {
    // Detectar si es modo PWA Instalada (Standalone)
    const standaloneMode = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (standaloneMode) {
      setIsStandalone(true);
    }

    // Detectar permiso de notificaciones activado
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setHasPushPermission(true);
    }

    // Detectar si es iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);

    if (iosDevice && !standaloneMode) {
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
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          console.log('El usuario aceptó la instalación nativa de Haedo Futsal');
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn('Error al solicitar prompt de instalación:', err);
        setShowModalGuide(true);
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      setShowModalGuide(true);
    }
  };

  // Ocultar completamente si el usuario lo cerró, si la App ya está Instalada PWA O si ya aceptó Alertas Push
  if (dismissed || isStandalone || hasPushPermission) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-[9999] bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg text-white animate-bounce-short">
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
            type="button"
            onClick={() => setDismissed(true)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {isIOS ? (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-[11px] space-y-1 text-slate-200 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Share className="w-4 h-4" /> Pasos para iPhone (Safari):
              </div>
              <p>1. Tocá el botón <strong>Compartir</strong> (📤) abajo en Safari.</p>
              <p>2. Seleccioná <strong>'Agregar a Inicio'</strong> (➕).</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer select-none"
            >
              <Download className="w-4 h-4 font-black" />
              ¡Instalar App Ahora!
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              const res = await registerPushSubscription(currentUser, true);
              if (res && res.success) {
                setHasPushPermission(true);
                alert('✅ ¡Tu celular quedó registrado con éxito en la base de datos de Supabase para recibir avisos con la app cerrada!');
              } else if (res && res.reason === 'denied') {
                alert('⚠️ Las notificaciones están bloqueadas en la configuración de tu celular/navegador. Actívalas en Configuración > Sitios > Notificaciones.');
              } else if (res && res.reason === 'db_error') {
                alert('⚠️ Error al guardar en base de datos: ' + (res.details || 'Error RLS / DB'));
              } else {
                alert('⚠️ No se pudo obtener el token Push del celular: ' + (res?.error || res?.reason || 'Servidor Push no disponible en este navegador'));
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-extrabold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer select-none"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            🔔 Activar Alertas Push
          </button>
        </div>
      </div>

      {/* Modal Guía Garantizada si el navegador no dispara el prompt nativo */}
      {showModalGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Cómo Instalar Haedo Futsal en tu Celular
              </h3>
              <button type="button" onClick={() => setShowModalGuide(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <p className="text-slate-300">
              Para instalar la app de <strong>Haedo Futsal</strong> en tu pantalla de inicio y compartir comprobantes directo desde Mercado Pago o tu banco:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">🤖 En Android (Chrome / Edge / Brave):</div>
                <p className="text-slate-400">
                  Toca los <strong>3 puntos verticales</strong> (arriba a la derecha en la barra del navegador) y selecciona <strong>"Añadir a la pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-sky-300">🍎 En iPhone / iOS (Safari):</div>
                <p className="text-slate-400">
                  Toca el botón <strong>Compartir</strong> (📤 abajo en Safari) y selecciona <strong>"Agregar al inicio"</strong> (➕).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModalGuide(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
