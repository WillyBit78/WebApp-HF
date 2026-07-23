import React from 'react';
import { Home, Calendar, Bell, User, CreditCard } from 'lucide-react';

export const BottomNav = ({ currentTab, setCurrentTab, activeRoleId }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'notices', label: 'Avisos', icon: Bell },
    { id: 'profile', label: 'Mi Perfil', icon: User },
  ];

  // Item especial para socios: Acceso rápido a pagos
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
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-amber-400 scale-110' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-amber-400/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {/* Solo mostrar el botón de pago rápido si es Socio */}
        {activeRoleId === 'socio' && (
          <button 
            onClick={() => setCurrentTab('payments')} 
            className={`flex flex-col items-center gap-1 transition-all ${
              currentTab === 'payments' ? 'text-amber-400 scale-110' : 'text-slate-500'
            }`}
          >
            <div className="p-1.5 bg-amber-500 rounded-full text-slate-900 shadow-lg shadow-amber-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium mt-1">Pagar</span>
          </button>
        )}
      </div>
    </div>
  );
};
```

**Ahora, voy a integrar este `BottomNav` en la estructura principal de la aplicación para que sea visible solo en móviles.** Para ello, necesito ver el archivo `src/App.jsx` y saber dónde se renderiza el layout general.

```tool
TOOL_NAME: read_file
BEGIN_ARG: filepath
"src/App.jsx"