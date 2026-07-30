import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Calendar, Bell, Wallet, Settings, Home, ShoppingBag } from 'lucide-react';

export const BottomNav = ({ currentTab, setCurrentTab, activeRoleId }) => {
  const { setAuditoriaFilterStatus } = useApp();

  const handleNavClick = (id) => {
    if (id === 'finance' && setAuditoriaFilterStatus) {
      setAuditoriaFilterStatus(null);
    }
    setCurrentTab(id);
  };
  const allNavItems = [
    { 
      id: 'users', 
      label: 'Socios', 
      icon: Users, 
      roles: ['admin', 'contador', 'coach'] 
    },
    { 
      id: 'dashboard', 
      label: 'Inicio', 
      icon: Home, 
      roles: ['socio'] 
    },
    { 
      id: 'calendar', 
      label: 'Calendario', 
      icon: Calendar, 
      roles: ['admin', 'contador', 'coach', 'socio'] 
    },
    { 
      id: 'notices', 
      label: 'Avisos', 
      icon: Bell, 
      roles: ['admin', 'contador', 'coach', 'socio'] 
    },
    { 
      id: 'store', 
      label: 'Tienda', 
      icon: ShoppingBag, 
      roles: ['admin', 'contador', 'coach', 'socio'] 
    },
    { 
      id: 'finance', 
      label: 'Finanzas', 
      icon: Wallet, 
      roles: ['admin', 'contador'] 
    },
    { 
      id: 'settings', 
      label: 'Ajustes', 
      icon: Settings, 
      roles: ['admin'] 
    },
  ];

  const filteredItems = allNavItems.filter(item => 
    item.roles.includes(activeRoleId || 'socio')
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 shadow-2xl">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'users' && currentTab === 'dashboard' && activeRoleId !== 'socio');
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-1 px-1.5 py-1 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-amber-400 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 fill-amber-400/20' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
