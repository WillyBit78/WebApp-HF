import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar } from 'lucide-react';

export const ModalAddEvent = ({ onClose }) => {
  const { addEvent } = useApp();
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'partido',
    categoria: 'Primera',
    lugar: 'Sede Central - Microestadio Haedo',
    fecha: '2026-07-28 20:30',
    detalles: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addEvent(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Nuevo Evento / Partido
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Título de la Actividad</label>
            <input
              type="text"
              required
              placeholder="Ej: Haedo Futsal vs Estudiantes"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="partido">Partido Oficial</option>
                <option value="entrenamiento">Entrenamiento</option>
                <option value="evento">Evento del Club</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="Sub-13">Sub-13</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Reserva">Reserva</option>
                <option value="Primera">Primera</option>
                <option value="Femenino">Femenino</option>
                <option value="Senior">Senior</option>
                <option value="Todas">Todas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Fecha y Hora</label>
            <input
              type="text"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Lugar / Cancha</label>
            <input
              type="text"
              required
              value={formData.lugar}
              onChange={(e) => setFormData({...formData, lugar: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Convocatoria / Indicaciones</label>
            <textarea
              rows="2"
              value={formData.detalles}
              onChange={(e) => setFormData({...formData, detalles: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
              placeholder="Ej: Presentarse 45 min antes con indumentaria completa..."
            ></textarea>
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
              Publicar Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
