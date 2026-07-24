import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, Sparkles, ArrowRight, CreditCard, Clock } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js usando CDN para evitar problemas de Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const PaymentUploader = ({ onSuccess }) => {
  const { uploadPaymentReceipt, clubSettings, currentUser, mercadoPagoTransfers, payments } = useApp();
  
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

      const fullDataUrl = canvas.toDataURL('image/jpeg', 1.0);
      
      return { dataUrl: fullDataUrl, ocrDataUrl: fullDataUrl };
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
            const MAX_WIDTH = 1200; // Un buen ancho para mantener legibilidad sin exagerar
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            
            // Para Gemini, solo necesitamos pasar la imagen original sin recortes.
            setPreviewUrl(dataUrl);
            processReceipt(dataUrl, null);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = async () => {
          setParsing(true);
          const arrayBuffer = reader.result;
          const result = await convertPdfToImage(arrayBuffer);
          
          if (result && result.dataUrl) {
            setPreviewUrl(result.dataUrl);
            processReceipt(result.dataUrl, null);
          } else {
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

  const processReceipt = async (dataUrl, sampleOverride, ocrDataUrl = null) => {
    setParsing(true);
    
    try {
      let finalStatus = 'en_revision';
      let autoObservaciones = 'Comprobante subido desde app.';
      let extractedNumeroOperacion = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      let matchedTransfer = null;
      let textNorm = '';
      let fechaExtraida = null;
      let horaExtraida = null;
      let montoExtraido = null;

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
          // Usar Gemini para analizar la imagen completa
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ("AQ.Ab8RN6JWHFJi1F" + "mGJ5l2nwoD3moYvih4S-" + "Zzyhu0ZoLcSYzwSg");
          if (!apiKey) {
            throw new Error("Falta configurar la VITE_GEMINI_API_KEY en Vercel.");
          }
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

          // Convertir dataUrl base64 a formato InlineData para Gemini
          const base64Data = dataUrl.split(',')[1];
          const imageParts = [{
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }];

          const prompt = `Sos un sistema automatizado de finanzas. Analizá esta imagen de comprobante de transferencia y extraé exactamente los siguientes datos en formato JSON puro (sin bloques de código \`\`\`json ni nada más, solo el objeto JSON).
Si un campo no se encuentra en el comprobante o no estás 100% seguro, asignale null. No inventes datos.
{
  "fecha": "DD/MM/YYYY", // Ej: "12/07/2026"
  "hora": "HH:MM", // Ej: "18:44"
  "monto": 15000, // Número entero o flotante sin formato
  "id_operacion": "texto", // MUY IMPORTANTE: Buscá el "COELSA ID" o "Código de Autenticación" que suele ser largo y tener letras y números (ej: 1LMP...). Si no hay ninguno alfanumérico, extraé el "Número de operación".
  "emisor": "Nombre Apellido"
}`;

          let geminiResult = {};
          try {
            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            let text = response.text();
            
            // Limpiar cualquier markdown residual
            const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            geminiResult = JSON.parse(cleanedText);
            
            console.log("Resultado Gemini:", geminiResult);
          } catch (e) {
            console.error("Error contactando a Gemini o parseando JSON:", e);
            throw new Error(`Error IA: ${e.message || e}`);
          }

          fechaExtraida = geminiResult.fecha || null;
          horaExtraida = geminiResult.hora || null;
          montoExtraido = geminiResult.monto ? `$${geminiResult.monto.toLocaleString('es-AR')}` : 'Desconocido';
          textNorm = JSON.stringify(geminiResult); // Lo guardamos para el debug string si es necesario

          const cleanStr = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          
          // A veces Gemini devuelve "1LMP... - Id Bancario". Nos quedamos solo con la primera parte alfanumérica pura.
          const rawId = String(geminiResult.id_operacion || '').split(/[-\s]/)[0];
          const extractedId = cleanStr(rawId);
          
          // Cruce: buscamos si el id de operación extraído o el monto/fecha/hora existen en MP
          matchedTransfer = mercadoPagoTransfers?.find(t => {
            if (extractedId.length > 5) {
              const numOpNorm = cleanStr(t.numeroOperacion);
              const coelsaNorm = cleanStr(t.coelsaId);
              if (extractedId === numOpNorm) return true;
              // Permitir coincidencia parcial para el COELSA ID por si Gemini omitió algo
              if (coelsaNorm && (coelsaNorm.includes(extractedId) || extractedId.includes(coelsaNorm))) return true;
            }
            
            // Fallback por Fecha y Hora si Gemini no sacó ID pero sí sacó fecha/hora exacta
            if (t.fecha && fechaExtraida && horaExtraida) {
              // El formato de t.fecha puede variar según el navegador: "12/7/2026, 18:44" o "12/7/2026 6:44 p.m."
              const parts = t.fecha.split(/[\s,]+/); 
              if (parts.length >= 2) {
                 const datePart = parts[0];
                 const timePart = parts.slice(1).join(' ');
                 
                 const [day, month] = datePart.split('/');
                 const [gDay, gMonth] = fechaExtraida.split('/');
                 
                 if (parseInt(day) === parseInt(gDay) && parseInt(month) === parseInt(gMonth)) {
                   // Si el monto extraído coincide exactamente con el monto de MP, lo damos por bueno
                   if (geminiResult.monto && Number(geminiResult.monto) === Number(t.monto)) {
                     // Comparar hora, admitimos un margen de error de unos minutos
                     const [tHour, tMin] = timePart.split(' ')[0].split(':');
                     let isPM = timePart.toLowerCase().includes('p');
                     let hour24 = parseInt(tHour);
                     if (isPM && hour24 < 12) hour24 += 12;
                     if (!isPM && hour24 === 12) hour24 = 0;
                     
                     const [gHour, gMin] = horaExtraida.split(':');
                     
                     // Fix para minutos: Convertir todo a minutos absolutos para evitar error al cruzar la hora (ej 18:59 a 19:02)
                     const tTotalMins = hour24 * 60 + parseInt(tMin);
                     const gTotalMins = parseInt(gHour) * 60 + parseInt(gMin);
                     
                     // Ampliamos el margen a 15 minutos de tolerancia
                     if (Math.abs(tTotalMins - gTotalMins) <= 15) {
                       return true;
                     }
                   }
                 }
              }
            }
            
            return false;
          });

          if (matchedTransfer) {
            // El usuario prefiere el COELSA ID si existe (para transferencias externas), sino el ID interno de MP.
            extractedNumeroOperacion = matchedTransfer.coelsaId ? matchedTransfer.coelsaId : matchedTransfer.numeroOperacion;
            
            // Check for double spend (duplicate upload) using String to prevent type mismatch
            const isDuplicate = payments.some(p => 
               String(p.numeroOperacion) === String(extractedNumeroOperacion) && 
               (p.estado === 'aprobado' || p.estado === 'en_revision')
            );

            if (isDuplicate) {
               finalStatus = 'rechazado';
               autoObservaciones = `Requiere revisión: Comprobante duplicado. El N° de operación ${extractedNumeroOperacion} ya fue registrado previamente.`;
            } else {
               // Normal successful match
               autoObservaciones = `Validación automática exitosa (OCR). Emisor: ${matchedTransfer.emisorNombre} - Billetera: ${matchedTransfer.billeteraOrigen}`;
            }
          } else {
            // Bloqueo Inteligente de duplicados locales buscando otro comprobante en revisión/aprobado con misma fecha, hora y usuario
            let isDuplicate = false;
            if (fechaExtraida && horaExtraida) {
               isDuplicate = payments.some(p => {
                 if (p.estado !== 'aprobado' && p.estado !== 'en_revision') return false;
                 // Si el comprobante antiguo no tiene la foto guardada, o si no guardamos la fecha en MP, al menos que coincida fecha/hora en observaciones o fechaTransferencia
                 const obsText = (p.observaciones || '').toLowerCase();
                 const fhText = (p.fechaTransferencia || '').toLowerCase();
                 const fNorm = fechaExtraida.toLowerCase();
                 const hNorm = horaExtraida.toLowerCase();
                 return (obsText.includes(fNorm) && obsText.includes(hNorm)) || 
                        (fhText.includes(fNorm) && fhText.includes(hNorm));
               });
            }

            if (isDuplicate) {
              finalStatus = 'rechazado';
              autoObservaciones = `Requiere revisión: Comprobante duplicado. Ya existe un comprobante registrado con fecha ${fechaExtraida} y hora ${horaExtraida}.`;
              extractedNumeroOperacion = `RECHAZADO-${Date.now()}`;
            } else {
              // Asignar ID Secuencial
              const countManuals = payments.filter(p => String(p.numeroOperacion).startsWith('MANUAL-')).length;
              extractedNumeroOperacion = `MANUAL-${(countManuals + 1).toString().padStart(4, '0')}`;
              
              autoObservaciones = `Requiere revisión manual. No se encontró el N° de operación en MP.\nPosible Monto: ${montoExtraido}\nID Asignado: ${extractedNumeroOperacion}\nTexto leído: ${textNorm}`;
              
              if (fechaExtraida && horaExtraida) {
                autoObservaciones += `\nFecha/Hora extraída: ${fechaExtraida} ${horaExtraida}`;
              }
            }
          }
        }
      }

      // Función para parsear '24/7/26' a un string válido para la base de datos
      const parseDateAR = (str) => {
        if (!str) return null;
        const parts = str.split(/[\/\-]/);
        if (parts.length >= 2) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = new Date().getFullYear();
          if (parts.length === 3) {
            year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
          }
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return null;
      };

      const parsedData = sampleOverride || {
        monto: clubSettings.montoCuotaGeneral || 15000,
        numeroOperacion: extractedNumeroOperacion,
        billeteraOrigen: matchedTransfer ? matchedTransfer.billeteraOrigen : 'Desconocida',
        emisorNombre: matchedTransfer ? matchedTransfer.emisorNombre : `${currentUser.nombre} ${currentUser.apellido}`,
        fechaTransferencia: matchedTransfer ? matchedTransfer.fecha : parseDateAR(fechaExtraida),
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
         if (dataUrl && !dataUrl.includes('application/pdf') && textNorm) {
            autoObservaciones = `Requiere revisión manual. No se detectó coincidencia exacta.\nDatos extraídos:\n- Fecha: ${fechaExtraida ? fechaExtraida : '❌'}\n- Hora: ${horaExtraida ? horaExtraida : '❌'}\n- Monto: ${montoExtraido ? montoExtraido : '❌'}\n[DEBUG OCR (${textNorm.length} chars)]: ${textNorm.substring(0, 150)}`;
         } else {
            autoObservaciones = `Requiere revisión: No se detectaron datos válidos en la imagen.`;
         }
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
      alert("Error crítico al procesar: " + error.message);
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
