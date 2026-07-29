import React from 'react';
import { ShoppingBag, Sparkles, Shirt, ShoppingCart } from 'lucide-react';

export const StoreModule = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[360px]">
        {/* Glow Decor */}
        <div className="absolute w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/40 rounded-3xl flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <ShoppingBag className="w-10 h-10 animate-bounce-short" />
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-amber-400 font-extrabold text-xs tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Próximamente
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight max-w-xl">
          La Tienda Oficial del Club
        </h1>

        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-md font-medium leading-relaxed">
          Próximamente vas a poder adquirir las camisetas oficiales, indumentaria de entrenamiento y merchandising de Haedo Futsal directamente desde la app.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-slate-300 text-xs font-bold">
            <Shirt className="w-4 h-4 text-amber-400" /> Camisetas de Juego
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-slate-300 text-xs font-bold">
            <ShoppingCart className="w-4 h-4 text-amber-400" /> Indumentaria Oficial
          </div>
        </div>
      </div>
    </div>
  );
};
