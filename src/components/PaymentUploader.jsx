import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, AlertCircle, FileText, Sparkles, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';

export const PaymentUploader = ({ onSuccess }) => {
  const { uploadPaymentReceipt, clubSettings, currentUser } = useApp();
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1); // 1: upload/sample, 2: verify/edit, 3: success

  // Simulated Mercado Pago Receipt presets for quick one-click testing
  const sampleReceipts = [
    {
      name: 'Comprobante Mercado Pago ($15.000)',
      monto: 15000,
      numeroOperacion: '9841029481',
      billeteraOrigen: 'Mercado Pago',
      emisorNombre: `${currentUser.nombre} ${currentUser.apellido}`,
      observaciones: 'Pago mensual de cuota de socio Haedo Futsal'
    },
    {
      name: 'Comprobante Cuenta DNI ($15.000)',
      monto: 15000,
      numeroOperacion: '0082736192',
      billeteraOrigen: 'Cuenta DNI',
      emisorNombre: `${currentUser.nombre} ${currentUser.apellido} (Titular)`,
      observaciones: 'Transferencia bancaria Banco Provincia'
    }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      simulateOCR();
    }
  };

  const handleSelectSample = (sample) => {
    setFile({ name: `${sample.billeteraOrigen}_Comprobante.jpg` });
    setPreviewUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80');
    setParsedData(sample);
    setStep(2);
  };

  const simulateOCR = () => {
    setParsing(true);
    setTimeout(() => {
      setParsing(false);
      setParsedData({
        monto: clubSettings.montoCuotaGeneral || 15000,
        numeroOperacion: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        billeteraOrigen: 'Mercado Pago',
        emisorNombre: `${currentUser.nombre} ${currentUser.apellido}`,
        observaciones: 'Cuota del mes transferida a CVU de Mercado Pago.'
      });
      setStep(2);
    }, 1200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsedData) return;
    
    uploadPaymentReceipt({
      ...parsedData,
      comprobanteUrl: previewUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80'
    });

    setStep(3);
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">Reportar Pago de Cuota</h3>
          <p className="text-xs text-slate-400">
            Sube el comprobante de transferencia enviado a <strong>{clubSettings.aliasMercadoPago}</strong>
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {/* Mercado Pago Account Details */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl text-xs space-y-1.5">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
              Datos de Cuenta de Mercado Pago del Club
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/50">
              <span className="text-slate-400">Alias MP:</span>
              <span className="font-mono font-bold text-amber-300">{clubSettings.aliasMercadoPago}</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-700/50">
              <span className="text-slate-400">Titular:</span>
              <span className="font-medium text-white">{clubSettings.cuentaTitular}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Monto Cuota:</span>
              <span className="font-bold text-emerald-400">${clubSettings.montoCuotaGeneral.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 group">
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="p-3 bg-slate-800 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-400 text-slate-400 mb-2 transition-all">
              <Upload className="w-6 h-6" />
            </div>
            <span className="font-semibold text-sm text-slate-200">Subir Comprobante (Imagen / Captura / PDF)</span>
            <span className="text-xs text-slate-500 mt-1">Soporta capturas de Mercado Pago, Cuenta DNI, Ualá, Galicia, etc.</span>
          </label>

          {/* Quick Demo Presets */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>O selecciona un comprobante simulado para la prueba rápida:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleReceipts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-xs transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-white">{sample.name}</div>
                    <div className="text-[10px] text-slate-400">Operación: N° {sample.numeroOperacion}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {parsing && (
        <div className="py-12 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-bounce" />
            Procesando e identificando datos del comprobante...
          </div>
          <p className="text-xs text-slate-400">Extrayendo N° de Operación, Monto y Billetera emisora...</p>
        </div>
      )}

      {step === 2 && parsedData && !parsing && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Comprobante Detectado Correctamente:</strong> Verifica los datos antes de enviar.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Monto Identificado ($)</label>
              <input 
                type="number"
                value={parsedData.monto}
                onChange={(e) => setParsedData({...parsedData, monto: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">N° de Operación / Transacción</label>
              <input 
                type="text"
                value={parsedData.numeroOperacion}
                onChange={(e) => setParsedData({...parsedData, numeroOperacion: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Billetera de Origen</label>
              <select
                value={parsedData.billeteraOrigen}
                onChange={(e) => setParsedData({...parsedData, billeteraOrigen: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              >
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Cuenta DNI">Cuenta DNI</option>
                <option value="Ualá">Ualá</option>
                <option value="Personal Pay">Personal Pay</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria (CBU/CVU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nombre Emisor</label>
              <input 
                type="text"
                value={parsedData.emisorNombre}
                onChange={(e) => setParsedData({...parsedData, emisorNombre: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Observaciones / Notas (Opcional)</label>
            <input 
              type="text"
              value={parsedData.observaciones}
              onChange={(e) => setParsedData({...parsedData, observaciones: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              placeholder="Ej: Pago cuota del hijo Sub-15..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              Volver
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Confirmar y Notificar a Finanzas
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-lg text-white">¡Comprobante Registrado con Éxito!</h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Se ha notificado al sector de finanzas para auditoría. Tu cuenta corriente cambiará automáticamente al estado <strong>Al Día</strong> en breve.
          </p>
        </div>
      )}
    </div>
  );
};
