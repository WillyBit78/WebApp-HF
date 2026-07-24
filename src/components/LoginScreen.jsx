import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, KeyRound, User, AlertCircle } from 'lucide-react';

export const LoginScreen = () => {
  const { login } = useApp();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);

  const [devClicks, setDevClicks] = useState(0);

  const handleLogoClick = () => {
    const newClicks = devClicks + 1;
    setDevClicks(newClicks);
    if (newClicks >= 5) {
      if (window.confirm('🔧 MODO DESARROLLADOR: ¿Deseas purgar la base de datos local y reiniciar la app?')) {
        localStorage.clear();
        window.location.reload();
      }
      setDevClicks(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(false);
    
    if (!usuario.trim() || !clave.trim()) {
      setError(true);
      return;
    }

    const success = login(usuario.trim(), clave.trim());
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center justify-center mb-8">
          <div 
            onClick={handleLogoClick}
            className="w-32 h-32 flex items-center justify-center mb-4 cursor-pointer select-none active:scale-95 transition-transform"
          >
            <img src="/logo.png" alt="Haedo Futsal Logo" className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            HAEDO <span className="text-red-500 font-extrabold">FUTSAL</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide mt-1">
            Más que un Club
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Usuario o clave incorrectos.</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value.toUpperCase())}
                  placeholder="Ej: PLOPEZ"
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-medium uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5 ml-1">PIN de 4 dígitos</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={clave}
                  onChange={(e) => setClave(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all text-xl tracking-[0.5em] font-black"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-base"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};
