import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Wallet, 
  UserCheck, 
  Users, 
  Calendar, 
  Bell, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles,
  Trophy,
  Download,
  Smartphone,
  LogOut
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { 
    currentUser, 
    stats, 
    logout, 
    payments = [], 
    setAuditoriaFilterStatus, 
    openAuditoriaStatus,
    markNotificationsAsViewed, 
    viewedNotifications = {} 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  // PWA Installation prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const totalAprobados = payments.filter(p => p.estado === 'aprobado').length;
  const totalEnRevision = payments.filter(p => p.estado === 'en_revision').length;
  const totalRechazados = payments.filter(p => p.estado === 'rechazado').length;

  const unreadAprobados = Math.max(0, totalAprobados - (viewedNotifications?.aprobado || 0));
  const unreadEnRevision = Math.max(0, totalEnRevision - (viewedNotifications?.en_revision || 0));
  const unreadRechazados = Math.max(0, totalRechazados - (viewedNotifications?.rechazado || 0));

  const handleNotificationClick = (status) => {
    if (currentUser?.rol !== 'admin' && currentUser?.rol !== 'contador') return;
    if (openAuditoriaStatus) {
      openAuditoriaStatus(status);
    } else if (setAuditoriaFilterStatus) {
      setAuditoriaFilterStatus(status);
    }
    if (markNotificationsAsViewed) markNotificationsAsViewed(status);
    setCurrentTab('finance');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[5.5rem]">
          {/* Brand Logo - Visible solo en vista mobile (en PC queda en la barra lateral) */}
          <div className="flex md:hidden items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-[60px] h-[60px] flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight flex items-center gap-1">
                HAEDO <span className="text-red-500 font-normal">FUTSAL</span>
              </span>
              <span 
                className="text-white font-bold tracking-wider -mt-0.5 block"
                style={{ 
                  fontFamily: "'Caveat', cursive", 
                  fontSize: '1.05rem',
                  lineHeight: '1',
                  textShadow: '0 0 1px #0f4c81, 0 1px 2px #0f4c81, 0 0 3px rgba(15,76,129,0.8)'
                }}
              >
                más que un club
              </span>
            </div>
          </div>

          {/* Center: Status Notification Badges (Solo visibles para Admin y Contador) */}
          {(currentUser?.rol === 'admin' || currentUser?.rol === 'contador') && (
            <div className="flex items-center gap-2">
              {unreadEnRevision > 0 && (
                <button
                  onClick={() => handleNotificationClick('en_revision')}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 animate-pulse shadow-md transition-all cursor-pointer"
                  title="Ir a comprobantes en revisión"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  {unreadEnRevision} En Revisión
                </button>
              )}

              {unreadAprobados > 0 && (
                <button
                  onClick={() => handleNotificationClick('aprobado')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 animate-pulse shadow-md transition-all cursor-pointer"
                  title="Ir a comprobantes aprobados"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {unreadAprobados} Aprobado{unreadAprobados > 1 ? 's' : ''}
                </button>
              )}

              {unreadRechazados > 0 && (
                <button
                  onClick={() => handleNotificationClick('rechazado')}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 animate-pulse shadow-md transition-all cursor-pointer"
                  title="Ir a comprobantes rechazados"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  {unreadRechazados} Rechazado{unreadRechazados > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Active User Badge & Stats */}
          <div className="hidden sm:flex items-center gap-3">
            {stats.pagosPendientesRev.length > 0 && (currentUser?.rol === 'admin' || currentUser?.rol === 'contador') && (
              <div 
                onClick={() => setCurrentTab('dashboard')}
                className="cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse"
              >
                <Wallet className="w-3.5 h-3.5" />
                {stats.pagosPendientesRev.length} pago(s) por auditar
              </div>
            )}

            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 pl-3 pr-2 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                {currentUser?.nombre ? currentUser.nombre.charAt(0) : 'U'}
              </div>
              <div className="text-left pr-2 border-r border-slate-700">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser?.nombre || 'Usuario'} {currentUser?.apellido ? currentUser.apellido.split(' ')[0] : ''}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentUser?.rol}
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>


          {/* Mobile Logout Button */}
          <div className="sm:hidden flex items-center">
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-xl transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

            {/* Mobile PWA Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Cómo Instalar Haedo Futsal en tu Celular
              </h3>
              <button onClick={() => setShowInstallModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Para que la app de <strong>Haedo Futsal</strong> aparezca en tu celular como opción al presionar <strong>"Compartir Comprobante"</strong> desde Mercado Pago o tu banco:
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">🤖 En Android (Chrome / Edge):</div>
                <p className="text-slate-400">
                  Toca los <strong>3 puntos verticales</strong> (arriba a la derecha) en tu navegador y selecciona <strong>"Añadir a la pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-sky-300">🍎 En iPhone / iOS (Safari):</div>
                <p className="text-slate-400">
                  Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba abajo en la pantalla) y selecciona <strong>"Agregar al inicio"</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
