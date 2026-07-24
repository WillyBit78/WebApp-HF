import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, Sparkles, ArrowRight, CreditCard, Clock } from 'lucide-react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js usando CDN para evitar problemas de Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const PaymentUploader = ({ onSuccess }) => {
  const { uploadPaymentReceipt, clubSettings, currentUser, mercadoPagoTransfers } = useApp();
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'aprobado' | 'en_revision'
  const [step, setStep] = useState(1); // 1: upload/sample, 3: success (step 2 removed)

  React.useEffect(() => {
    const checkSharedFile = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('shared') === 'true') {
        try {
          const cache = await caches.open('shared-receipts');
          const response = await cache.match('/shared-receipt.jpg');
          if (response) {
            const blob = await response.blob();
            const sharedFile = new File([blob], 'comprobante_compartido.jpg', { type: blob.type || 'image/jpeg' });
            
            await cache.delete('/shared-receipt.jpg');
            window.history.replaceState({}, document.title, window.location.pathname);
            
            handleFileChange({ target: { files: [sharedFile] } });
          }
        } catch (e) {
          console.error("Error loading shared file:", e);
        }
      }
    };
    checkSharedFile();
  }, []);

  const sampleReceipts = [
    {
      name: 'Comprobante MP (Simular Aprobado)',
      monto: 15000,
      numeroOperacion: '9841029481', // Simularemos que esta existe
      billeteraOrigen: 'Mercado Pago',
      emisorNombre: `${currentUser.nombre} ${currentUser.apellido}`,
      observaciones: 'Pago mensual de cuota de socio Haedo Futsal'
    },
    {
      name: 'Comprobante Otro (Simular Revisión)',
      monto: 15000,
      numeroOperacion: '0082736192',
      billeteraOrigen: 'Cuenta DNI',
      emisorNombre: `${currentUser.nombre} ${currentUser.apellido} (Titular)`,
      observaciones: 'Transferencia bancaria Banco Provincia'
    }
  ];

  const convertPdfToImage = async (fileBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 }); // alta calidad
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error("Error convirtiendo PDF a imagen:", err);
      return null;
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setPreviewUrl(dataUrl);
            processReceipt(dataUrl, null);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = async () => {
          setParsing(true); // Mostrar loader mientras se convierte el PDF
          const arrayBuffer = reader.result;
          const imgDataUrl = await convertPdfToImage(arrayBuffer);
          
          if (imgDataUrl) {
            setPreviewUrl(imgDataUrl);
            processReceipt(imgDataUrl, null); // Pasamos la IMAGEN del PDF al OCR
          } else {
            // Si falla la conversión, caemos en revisión manual
            const fallbackReader = new FileReader();
            fallbackReader.onloadend = () => {
              setPreviewUrl(fallbackReader.result);
              processReceipt(fallbackReader.result, null);
            };
            fallbackReader.readAsDataURL(selectedFile);
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
          processReceipt(reader.result, null);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleSelectSample = (sample) => {
    setFile({ name: `${sample.billeteraOrigen}_Comprobante.jpg` });
    setPreviewUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80');
    processReceipt('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80', sample);
  };

  const processReceipt = async (dataUrl, sampleOverride) => {
    setParsing(true);
    
    try {
      let finalStatus = 'en_revision';
      let autoObservaciones = 'Comprobante subido desde app.';
      let extractedNumeroOperacion = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      let matchedTransfer = null;

      if (sampleOverride) {
        // Lógica de simulación
        extractedNumeroOperacion = sampleOverride.numeroOperacion;
        matchedTransfer = mercadoPagoTransfers?.find(t => 
          t.numeroOperacion === sampleOverride.numeroOperacion || 
          (t.coelsaId && t.coelsaId === sampleOverride.numeroOperacion)
        );
        if (sampleOverride.numeroOperacion === '9841029481') {
           finalStatus = 'aprobado'; 
           autoObservaciones = 'Validación automática exitosa (Simulación).';
        }
      } else {
        // LÓGICA OCR REAL
        if (dataUrl.includes('application/pdf')) {
          finalStatus = 'en_revision';
          autoObservaciones = 'Comprobante en formato PDF. Requiere revisión manual visual.';
        } else {
          const result = await Tesseract.recognize(dataUrl, 'spa');
          const textUpper = result.data.text.toUpperCase();
          console.log("Texto extraído por OCR:", textUpper);

          // Cruce: buscamos si algún N° de Operación o COELSA ID de MP existe en el texto leído
          matchedTransfer = mercadoPagoTransfers?.find(t => 
            textUpper.includes(String(t.numeroOperacion).toUpperCase()) || 
            (t.coelsaId && textUpper.includes(String(t.coelsaId).toUpperCase()))
          );

          if (matchedTransfer) {
            const isOperacion = textUpper.includes(String(matchedTransfer.numeroOperacion).toUpperCase());
            extractedNumeroOperacion = isOperacion ? matchedTransfer.numeroOperacion : matchedTransfer.coelsaId;
          }
        }
      }

      const parsedData = sampleOverride || {
        monto: clubSettings.montoCuotaGeneral || 15000,
        numeroOperacion: extractedNumeroOperacion,
        billeteraOrigen: matchedTransfer ? matchedTransfer.billeteraOrigen : 'Desconocida',
        emisorNombre: matchedTransfer ? matchedTransfer.emisorNombre : `${currentUser.nombre} ${currentUser.apellido}`,
        observaciones: 'Cuota procesada vía OCR'
      };

      if (matchedTransfer) {
         if (Number(matchedTransfer.monto) === Number(parsedData.monto)) {
           finalStatus = 'aprobado';
           autoObservaciones = 'Validación automática exitosa (OCR).';
         } else {
           autoObservaciones = `Requiere revisión: El monto teórico ($${parsedData.monto}) no coincide con el registro de MP ($${matchedTransfer.monto}).`;
         }
      } else if (finalStatus !== 'aprobado') {
         autoObservaciones = `Requiere revisión: No se detectó un N° de operación o COELSA ID válido en la imagen.`;
      }

      setPaymentStatus(finalStatus);

      uploadPaymentReceipt({
        ...parsedData,
        estado: finalStatus,
        observaciones: autoObservaciones,
        comprobanteUrl: dataUrl
      });

      setParsing(false);
      setStep(3);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error("Error en OCR:", error);
      setParsing(false);
      alert("Hubo un problema al escanear la imagen. Intenta de nuevo.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Reportar Pago de Cuota</h3>
            <p className="text-xs text-slate-400">
              Sube tu comprobante. Nuestro sistema inteligente lo procesará automáticamente.
            </p>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-xl text-center">
             <div className="text-slate-400 font-medium mb-1">Monto a Pagar:</div>
             <div className="text-4xl font-black text-emerald-400">
               ${(currentUser.montoCuota || clubSettings.montoCuotaGeneral || 15000).toLocaleString('es-AR')}
             </div>
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 group">
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="p-4 bg-slate-800 rounded-full group-hover:bg-red-500/20 group-hover:text-red-400 text-slate-400 mb-3 transition-all">
              <Upload className="w-8 h-8" />
            </div>
            <span className="font-bold text-base text-slate-200">Subir Comprobante</span>
            <span className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">Selecciona la imagen o captura en tu dispositivo</span>
          </label>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Pruebas rápidas (Simulación):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleReceipts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-red-500/40 text-xs transition-all flex items-center justify-between"
                >
                  <div className="font-medium text-white">{sample.name}</div>
                  <ArrowRight className="w-4 h-4 text-red-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {parsing && (
        <div className="py-12 text-center space-y-4">
          <div className="w-14 h-14 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin mx-auto"></div>
          <div className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-bounce text-red-400" />
            Analizando comprobante...
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Estamos verificando automáticamente los datos contra nuestra cuenta de Mercado Pago.
          </p>
        </div>
      )}

      {step === 3 && paymentStatus === 'aprobado' && (
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="font-black text-2xl text-emerald-400 tracking-tight">¡Aceptada y Verificada!</h4>
          <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            Hemos validado tu pago automáticamente con éxito. Tu cuenta corriente se ha actualizado a estado <strong>Al Día</strong>.
          </p>
        </div>
      )}

      {step === 3 && paymentStatus === 'en_revision' && (
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h4 className="font-black text-2xl text-amber-400 tracking-tight">En Revisión</h4>
          <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            Hemos recibido tu comprobante, pero necesita ser verificado manualmente por finanzas. Te notificaremos cuando se apruebe.
          </p>
        </div>
      )}
    </div>
  );
};
