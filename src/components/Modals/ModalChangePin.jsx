import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Key, Lock, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const ModalChangePin = ({ onClose }) => {
  const { currentUser, addOrUpdateUser, setCurrentUser } = useApp();

  const [pinActual, setPinActual] = useState('');
  const [pinNuevo, setPinNuevo] = useState('');
  const [pinConfirmar, setPinConfirmar] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validar PIN Actual
    if (String(pinActual).trim() !== String(currentUser?.clave || '').trim()) {
      setErrorMsg('El PIN actual es incorrecto.');
      return;
    }

    // Validar que el nuevo PIN sea numérico y de 4 dígitos
    if (!/^\d{4}$/.test(pinNuevo)) {
      setErrorMsg('El nuevo PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    // Validar confirmación
    if (pinNuevo !== pinConfirmar) {
      setErrorMsg('El nuevo PIN y la confirmación no coinciden.');
      return;
    }

    // Guardar nuevo PIN
    const updatedUser = { ...currentUser, clave: pinNuevo };
    addOrUpdateUser(updatedUser);
    if (setCurrentUser) setCurrentUser(updatedUser);

    setSuccessMsg('¡PIN actualizado correctamente!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Cambiar PIN de Acceso</h3>
              <p className="text-[11px] text-slate-400">PIN personal de 4 dígitos</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">PIN Actual (4 dígitos)</label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                required
                value={pinActual}
                onChange={(e) => setPinActual(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-amber-400 font-mono text-lg tracking-widest focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Nuevo PIN (4 dígitos)</label>
            <input
              type="password"
              maxLength={4}
              required
              value={pinNuevo}
              onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-emerald-400 font-mono text-lg tracking-widest focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Confirmar Nuevo PIN</label>
            <input
              type="password"
              maxLength={4}
              required
              value={pinConfirmar}
              onChange={(e) => setPinConfirmar(e.target.value.replace(/\D/g, ''))}
              placeholder="****"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-center text-emerald-400 font-mono text-lg tracking-widest focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              Guardar PIN
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
