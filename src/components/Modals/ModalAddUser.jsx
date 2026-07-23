import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus } from 'lucide-react';

export const CLUB_CATEGORIES = {
  'BAFI Femenino': ['1ra', 'Reserva'],
  'EDEFI Mayores': ['+30', '+35', '+42'],
  'EDEFI Baby': ['2013', '2014', '2015', '2016', '2017', '2018'],
  'FUTSALA Promo': ['2016', '2017', '2018'],
  'FUTSALA Masculino': ['1ra', '3ra', '4ta', '5ta', '6ta', '7ma', '8va'],
  'BAFI Masculino': ['1ra', 'Reserva', '3ra', '4ta', '5ta']
};

export const ModalAddUser = ({ onClose }) => {
  const { addOrUpdateUser, cuotasPorCategoria } = useApp();
  
  const [categoriaMadre, setCategoriaMadre] = useState('BAFI Femenino');
  const [subCategoria, setSubCategoria] = useState('1ra');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    rol: 'socio',
    categoria: 'BAFI Femenino (1ra)'
  });

  const handleMadreChange = (catMadre) => {
    setCategoriaMadre(catMadre);
    const firstSub = CLUB_CATEGORIES[catMadre][0];
    setSubCategoria(firstSub);
    setFormData(prev => ({
      ...prev,
      categoria: `${catMadre} (${firstSub})`,
      montoCuota: cuotasPorCategoria[catMadre] || 15000
    }));
  };

  const handleSubChange = (sub) => {
    setSubCategoria(sub);
    setFormData(prev => ({
      ...prev,
      categoria: `${categoriaMadre} (${sub})`,
      montoCuota: cuotasPorCategoria[categoriaMadre] || 15000
    }));
  };

  // Autogenerar usuario: Inicial nombre + apellido completo (sin espacios y en mayúsculas)
  const generarUsuario = () => {
    if (!formData.nombre || !formData.apellido) return '';
    const inicial = formData.nombre.charAt(0).toUpperCase();
    const apellido = formData.apellido.replace(/\s+/g, '').toUpperCase();
    return `${inicial}${apellido}`;
  };

  const usuarioGenerado = generarUsuario();

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrUpdateUser({
      ...formData,
      usuario: usuarioGenerado,
      clave: '1234', // PIN por defecto
      montoCuota: cuotasPorCategoria[categoriaMadre] || 15000
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" /> Alta / Registro de Socio
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Apellido</label>
              <input
                type="text"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Usuario de Acceso:</span>
              <span className="text-amber-400 font-black tracking-widest">{usuarioGenerado || '---'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">PIN de Seguridad:</span>
              <span className="text-slate-300 font-mono tracking-widest">1234 (Por defecto)</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Teléfono (WhatsApp)</label>
            <input
              type="text"
              required
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Rol de Acceso</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none font-semibold"
            >
              <option value="socio">Socio / Jugador</option>
              <option value="coach">Coach / DT</option>
              <option value="contador">Contador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Categoría Madre</label>
              <select
                value={categoriaMadre}
                onChange={(e) => handleMadreChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-amber-300 font-bold outline-none text-xs"
              >
                {Object.keys(CLUB_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Sub-categoría (Plantel)</label>
              <select
                value={subCategoria}
                onChange={(e) => handleSubChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold outline-none text-xs"
              >
                {CLUB_CATEGORIES[categoriaMadre].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Cuota Mensual correspondiente:</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              ${(cuotasPorCategoria[categoriaMadre] || 15000).toLocaleString('es-AR')}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg shadow-amber-500/20"
            >
              Guardar Socio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
