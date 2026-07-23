import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  Plus, 
  Calendar, 
  Bell, 
  Trophy, 
  Users, 
  CheckCircle, 
  Clock, 
  Megaphone,
  Filter,
  Trash2
} from 'lucide-react';

export const DashboardCoach = ({ onOpenModalUser, onOpenModalEvent, onOpenModalNotice }) => {
  const { users, events, notices, currentUser, deleteUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const categories = ['Todas', 'Sub-13', 'Sub-15', 'Sub-17', 'Reserva', 'Primera', 'Femenino', 'Senior'];

  const filteredUsers = users.filter(u => {
    if (selectedCategory === 'Todas') return true;
    return u.categoria === selectedCategory;
  });

  const filteredEvents = events.filter(e => {
    if (selectedCategory === 'Todas') return true;
    return e.categoria === selectedCategory || e.categoria === 'Todas';
  });

  return (
    <div className="space-y-6">
      {/* Coach Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/20 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" /> SECTOR CUERPO TÉCNICO Y DEPORTES
          </div>
          <h2 className="text-2xl font-extrabold text-white">Gestión de Planteles y Convocatorias</h2>
          <p className="text-xs text-slate-400 mt-1">
            DT Activo: <strong>{currentUser.nombre} {currentUser.apellido}</strong> (Categoría {currentUser.categoria})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onOpenModalUser}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Alta de Socio / Jugador
          </button>
          <button
            onClick={onOpenModalEvent}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Calendar className="w-4 h-4" /> Crear Partido / Práctica
          </button>
          <button
            onClick={onOpenModalNotice}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
          >
            <Megaphone className="w-4 h-4" /> Enviar Comunicado Masivo
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Categoría:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster Table (ABM Socios) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Plantel de Jugadores ({filteredUsers.length})
            </h3>
            <span className="text-xs text-slate-400">Categoría: {selectedCategory}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Jugador / Socio</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Estado Cuota</th>
                  <th className="p-3 text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-bold text-white">{u.nombre} {u.apellido}</div>
                      <div className="text-[10px] text-slate-400">N° Socio: #{u.numeroSocio}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300">
                        {u.categoria}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{u.telefono}</td>
                    <td className="p-3">
                      {u.estadoCuota === 'al_dia' ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Al día
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg"
                        title="Baja de jugador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Team Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Próximos Partidos y Prácticas
          </h3>

          <div className="space-y-3">
            {filteredEvents.map(evt => (
              <div 
                key={evt.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    evt.tipo === 'partido' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {evt.tipo} • {evt.categoria}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{evt.fecha}</span>
                </div>

                <div className="font-bold text-white text-sm">{evt.titulo}</div>
                <div className="text-slate-400 text-[11px]">📍 {evt.lugar}</div>
                {evt.detalles && (
                  <div className="text-amber-300/80 text-[10px] bg-slate-900 p-2 rounded border border-slate-800">
                    ℹ️ {evt.detalles}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
