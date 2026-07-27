import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DISCIPLINAS_CONFIG } from '../DashboardSocios';
import { X, Megaphone, Send, RotateCcw, Clock, AlertTriangle, Filter, Users, ShieldAlert } from 'lucide-react';

export const ModalAddNotice = ({ onClose }) => {
  const { addNotice, notices, currentUser } = useApp();

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    destinatarioTipo: 'todos', // todos | disciplina | categoria | subcategoria
    destinatarioValor: 'Todos los Socios',
    filtroEstadoCuenta: 'todos', // todos | al_dia | pendiente
    urgente: false,
    fechaProgramada: ''
  });

  const [selectedNoticeToReuse, setSelectedNoticeToReuse] = useState('');

  // Handle auto-population when reusing a previous notice
  const handleReuseNotice = (noticeId) => {
    setSelectedNoticeToReuse(noticeId);
    if (!noticeId) return;

    const found = notices.find(n => n.id === noticeId);
    if (found) {
      setFormData({
        titulo: found.titulo || '',
        contenido: found.contenido || '',
        destinatarioTipo: found.destinatarioTipo || 'todos',
        destinatarioValor: found.destinatarioValor || found.categoriaDestino || 'Todos los Socios',
        filtroEstadoCuenta: found.filtroEstadoCuenta || 'todos',
        urgente: Boolean(found.urgente),
        fechaProgramada: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addNotice({
      ...formData,
      categoriaDestino: formData.destinatarioValor
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-slate-200 my-auto relative">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Crear Comunicado u Aviso</h3>
              <p className="text-[11px] text-slate-400">Difusión masiva + Push Notification en celulares</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option to Reuse Previous Notices */}
        {notices.length > 0 && (
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
            <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reutilizar un Aviso Anterior:
            </label>
            <select
              value={selectedNoticeToReuse}
              onChange={(e) => handleReuseNotice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:border-amber-400 outline-none"
            >
              <option value="">-- Seleccionar comunicado enviado previamente --</option>
              {notices.map(n => (
                <option key={n.id} value={n.id}>
                  {n.fecha} • {n.titulo} ({n.destinatarioValor || n.categoriaDestino || 'Todos'})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Título */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Título del Comunicado</label>
            <input
              type="text"
              required
              placeholder="Ej: Convocatoria Partido Oficial / Horario Entrenamientos"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Destinatarios (Jerárquico) */}
          <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="block text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Segmentación de Destinatarios (Targeting)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tipo de Alcance</label>
                <select
                  value={formData.destinatarioTipo}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    let defaultVal = 'Todos los Socios';
                    if (tipo === 'disciplina') defaultVal = 'Futbol Baby';
                    if (tipo === 'categoria') defaultVal = 'FUTSALA Masculino';
                    setFormData({ ...formData, destinatarioTipo: tipo, destinatarioValor: defaultVal });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-amber-400"
                >
                  <option value="todos">🌐 Todos los Socios del Club</option>
                  <option value="disciplina">🏆 Por Disciplina Entera</option>
                  <option value="categoria">⚽ Por Categoría / Torneo</option>
                  <option value="subcategoria">🎯 Por Sub-categoría Específica</option>
                </select>
              </div>

              {formData.destinatarioTipo !== 'todos' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Seleccionar Destinatario</label>
                  <select
                    value={formData.destinatarioValor}
                    onChange={(e) => setFormData({ ...formData, destinatarioValor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-400"
                  >
                    {formData.destinatarioTipo === 'disciplina' && DISCIPLINAS_CONFIG.map(d => (
                      <option key={d.id} value={d.nombre}>{d.nombre}</option>
                    ))}

                    {formData.destinatarioTipo === 'categoria' && (
                      <>
                        <option value="EDEFI Baby">EDEFI Baby</option>
                        <option value="FUTSALA Promo">FUTSALA Promo</option>
                        <option value="FUTSALA Masculino">FUTSALA Masculino</option>
                        <option value="BAFI Masculino">BAFI Masculino</option>
                        <option value="BAFI Femenino">BAFI Femenino</option>
                        <option value="EDEFI Mayores">EDEFI Mayores</option>
                      </>
                    )}

                    {formData.destinatarioTipo === 'subcategoria' && (
                      <>
                        <option value="FUTSALA Masculino (1ra)">FUTSALA Masculino - 1ra</option>
                        <option value="FUTSALA Masculino (3ra)">FUTSALA Masculino - 3ra</option>
                        <option value="FUTSALA Masculino (4ta)">FUTSALA Masculino - 4ta</option>
                        <option value="BAFI Femenino (1ra)">BAFI Femenino - 1ra</option>
                        <option value="BAFI Femenino (Reserva)">BAFI Femenino - Reserva</option>
                        <option value="EDEFI Baby (2013)">EDEFI Baby - 2013</option>
                        <option value="EDEFI Baby (2014)">EDEFI Baby - 2014</option>
                        <option value="EDEFI Baby (2015)">EDEFI Baby - 2015</option>
                        <option value="EDEFI Mayores (+30)">EDEFI Mayores - +30</option>
                        <option value="EDEFI Mayores (+35)">EDEFI Mayores - +35</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Filtro Estado de Cuenta */}
            <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filtro Estado de Cuota:
              </label>
              <select
                value={formData.filtroEstadoCuenta}
                onChange={(e) => setFormData({ ...formData, filtroEstadoCuenta: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
              >
                <option value="todos">Todos los Estados (Al día y Morosos)</option>
                <option value="al_dia">🟢 Solo Socios AL DÍA</option>
                <option value="pendiente">🔴 Solo Socios PENDIENTES / MOROSOS</option>
              </select>
            </div>
          </div>

          {/* Mensaje / Contenido */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Mensaje / Contenido</label>
            <textarea
              rows="4"
              required
              placeholder="Escribe el mensaje oficial del comunicado..."
              value={formData.contenido}
              onChange={(e) => setFormData({...formData, contenido: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none focus:border-amber-400 transition-colors leading-relaxed"
            ></textarea>
          </div>

          {/* Programar y Marcar Urgente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
              <input
                type="checkbox"
                id="urgente"
                checked={formData.urgente}
                onChange={(e) => setFormData({...formData, urgente: e.target.checked})}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="urgente" className="text-slate-200 font-extrabold cursor-pointer flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Aviso URGENTE 🚨
              </label>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Programar Envío Automático (Opcional):
              </label>
              <input
                type="datetime-local"
                value={formData.fechaProgramada}
                onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Difundir + Enviar Push Notification
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
