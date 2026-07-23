import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Megaphone } from 'lucide-react';

export const ModalAddNotice = ({ onClose }) => {
  const { addNotice } = useApp();
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoriaDestino: 'Todos',
    urgente: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addNotice(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-400" /> Nuevo Comunicado Oficial
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Título del Comunicado</label>
            <input
              type="text"
              required
              placeholder="Ej: Cambio de Horario Entrenamientos"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Destinatarios</label>
            <select
              value={formData.categoriaDestino}
              onChange={(e) => setFormData({...formData, categoriaDestino: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
            >
              <option value="Todos">Todos los Socios</option>
              <option value="Primera">Primera</option>
              <option value="Sub-17">Sub-17</option>
              <option value="Sub-15">Sub-15</option>
              <option value="Sub-13">Sub-13</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Mensaje / Contenido</label>
            <textarea
              rows="3"
              required
              value={formData.contenido}
              onChange={(e) => setFormData({...formData, contenido: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="urgente"
              checked={formData.urgente}
              onChange={(e) => setFormData({...formData, urgente: e.target.checked})}
              className="rounded bg-slate-800 border-slate-700 text-amber-500"
            />
            <label htmlFor="urgente" className="text-slate-300 font-bold cursor-pointer">
              Marcar como aviso URGENTE 🚨
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-500/20"
            >
              Difundir Comunicado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
