import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Bell, 
  Settings, 
  Wallet, 
  ShieldCheck,
  LogOut,
  Trophy
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, activeRoleId }) => {
  const menuGroups = [
    {
      label: 'General',
      items: [
        { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'notices', label: 'Comunicados', icon: Bell },
      ]
    },
    {
      label: 'Administración',
      items: [
        { id: 'users', label: 'Gestión de Socios', icon: Users, roles: ['admin'] },
        { id: 'finance', label: 'Control Financiero', icon: Wallet, roles: ['admin', 'contador'] },
        { id: 'settings', label: 'Ajustes del Club', icon: Settings, roles: ['admin'] },
      ]
    }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white leading-none">HAEDO</span>
          <span 
            className="text-blue-900 font-bold tracking-wider"
            style={{ 
              fontFamily: "'Caveat', cursive", 
              fontSize: '1.12rem',
              lineHeight: '1',
              textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
            }}
          >
            más que un club
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                // Validar si el rol actual tiene permiso para ver este item
                if (item.roles && !item.roles.includes(activeRoleId)) return null;

                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            {activeRoleId.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-white truncate">Modo: {activeRoleId}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Acceso Activo</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
