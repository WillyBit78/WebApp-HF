import React from 'react';
import { Home, Calendar, Bell, User, CreditCard } from 'lucide-react';

export const BottomNav = ({ currentTab, setCurrentTab, activeRoleId }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'notices', label: 'Avisos', icon: Bell },
    { id: 'profile', label: 'Mi Perfil', icon: User },
  ];

  const socioItem = { id: 'payments', label: 'Pagar', icon: CreditCard };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-amber-400/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {activeRoleId === 'socio' && (
          <button 
            onClick={() => setCurrentTab('payments')} 
            className={`flex flex-col items-center gap-1 transition-all ${currentTab === 'payments' ? 'text-amber-400 scale-110' : 'text-slate-500'}`}
          >
            <div className="p-1.5 bg-red-600 rounded-full text-white shadow-lg shadow-amber-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium mt-1">Pagar</span>
          </button>
        )}
      </div>
    </div>
  );
};
