import React, { useState } from 'react';
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
  Trophy
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { activeRoleId, setActiveRoleId, roles, currentUser, stats } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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
      {/* Role Switcher Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-medium text-amber-300">DEMO INTERACTIVA DE ACCESO:</span>
            <span className="hidden sm:inline text-slate-400">Selecciona el nivel de acceso para probar la app:</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1 rounded-full font-medium text-slate-200 transition-all text-xs"
            >
              {getRoleIcon(activeRoleId)}
              <span className="capitalize">{activeRoleId}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Cambiar Rol de Acceso
                </div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRoleId(r.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-all ${
                      activeRoleId === r.id 
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">{getRoleIcon(r.id)}</div>
                    <div>
                      <div className="font-semibold text-xs text-white">{r.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
            {stats.pagosPendientesRev.length > 0 && (activeRoleId === 'admin' || activeRoleId === 'contador') && (
              <div 
                onClick={() => setCurrentTab('dashboard')}
                className="cursor-pointer bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse"
              >
                <Wallet className="w-3.5 h-3.5" />
                {stats.pagosPendientesRev.length} pago(s) por auditar
              </div>
            )}

            <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                {currentUser.nombre.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser.nombre} {currentUser.apellido.split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentUser.rol} • {currentUser.categoria}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
