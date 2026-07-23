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
  const { roles, currentUser, stats, logout } = useApp();
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

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('El usuario instaló la PWA de Haedo Futsal');
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  const getRoleIcon = (roleId) => {
    switch(roleId) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'contador': return <Wallet className="w-4 h-4 text-amber-400" />;
      case 'coach': return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'socio': return <Users className="w-4 h-4 text-purple-400" />;
      default: return null;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: Trophy },
    { id: 'calendar', label: 'Calendario & Partidos', icon: Calendar },
    { id: 'notices', label: 'Comunicados', icon: Bell }
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-xl tracking-tighter">
              HF
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1">
                HAEDO <span className="text-amber-400 font-extrabold">FUTSAL</span>
              </span>
              <span className="text-[10px] block text-slate-400 font-medium tracking-wide">
                GESTIÓN OFICIAL DE CLUB
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

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


          {/* Mobile menu button hidden to prioritize BottomNav */}
          <div className="md:hidden w-10"></div>
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
