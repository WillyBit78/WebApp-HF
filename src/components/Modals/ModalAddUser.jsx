import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserPlus, Check } from 'lucide-react';

export const CLUB_CATEGORIES = {
  'BAFI Femenino': ['1ra', 'Reserva'],
  'EDEFI Mayores': ['+30', '+35', '+42'],
  'EDEFI Baby': ['2013', '2014', '2015', '2016', '2017', '2018'],
  'FUTSALA Promo': ['2016', '2017', '2018'],
  'FUTSALA Masculino': ['1ra', '3ra', '4ta', '5ta', '6ta', '7ma', '8va'],
  'BAFI Masculino': ['1ra', 'Reserva', '3ra', '4ta', '5ta']
};

export const ModalAddUser = ({ onClose }) => {
  const { addOrUpdateUser } = useApp();
  
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    rol: 'staff',
    categoria: ''
  });

  const [selectedCoachCats, setSelectedCoachCats] = useState([]);

  const handleNombreChange = (val) => {
    setFormData(prev => ({
      ...prev,
      nombre: val
    }));
  };

  const toggleCoachCat = (catName) => {
    setSelectedCoachCats(prev => {
      const exists = prev.includes(catName);
      return exists ? prev.filter(c => c !== catName) : [...prev, catName];
    });
  };

  // Generar usuario a partir del Nombre ingresado (sin espacios y en minúsculas)
  const usuarioGenerado = formData.nombre.trim() 
    ? formData.nombre.trim().replace(/\s+/g, '').toLowerCase() 
    : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    const finalCat = formData.rol === 'coach' 
      ? (selectedCoachCats.length > 0 ? selectedCoachCats.join(', ') : 'Todas las Categorías') 
      : 'Staff';

    addOrUpdateUser({
      nombre: formData.nombre.trim(),
      apellido: '',
      telefono: formData.telefono.trim(),
      rol: formData.rol,
      categoria: finalCat,
      montoCuota: 0,
      estadoCuota: 'al_dia',
      usuario: usuarioGenerado,
      clave: '1234'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" /> Alta Staff
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Campo Único: Nombre */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nombre (Nombre e Inicial/Apellido)</label>
            <input
              type="text"
              required
              placeholder="Ej: Marcelo DT, Juan Perez"
              value={formData.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          {/* Nombre autogenera el Usuario de Acceso */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Usuario de Acceso:</span>
              <span className="text-amber-400 font-black font-mono">@{usuarioGenerado || '---'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">PIN de Seguridad:</span>
              <span className="text-slate-300 font-mono tracking-widest">1234 (Por defecto)</span>
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Teléfono (WhatsApp)</label>
            <input
              type="text"
              placeholder="Ej: 1112345678"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Rol de Acceso (Solo Staff, Coach, Adm.Club) */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Rol de Acceso</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 outline-none font-bold text-xs cursor-pointer"
            >
              <option value="staff">Staff (Sin acceso a finanzas)</option>
              <option value="coach">Coach (Seleccionar categorías de trabajo)</option>
              <option value="contador">Adm.Club (Administrador y finanzas)</option>
            </select>
          </div>

          {/* Selección de Categorías para Coach */}
          {formData.rol === 'coach' && (
            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-amber-400 text-[11px] font-bold">
                Categorías en las que trabaja el Coach:
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {Object.keys(CLUB_CATEGORIES).map(cat => {
                  const isChecked = selectedCoachCats.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCoachCat(cat)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold text-left flex items-center justify-between border transition-all cursor-pointer ${
                        isChecked 
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isChecked && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-colors cursor-pointer"
            >
              Guardar Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
