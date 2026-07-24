import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, Sparkles, ArrowRight, CreditCard, Clock } from 'lucide-react';
import Tesseract from 'tesseract.js';
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
      
      const ocrCanvas = document.createElement('canvas');
      const ocrCtx = ocrCanvas.getContext('2d');
      const cropHeight = canvas.height * 0.7;
      const cropY = canvas.height - cropHeight;
      ocrCanvas.width = canvas.width;
      ocrCanvas.height = cropHeight;
      ocrCtx.drawImage(canvas, 0, cropY, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);
      
      const ocrDataUrl = ocrCanvas.toDataURL('image/jpeg', 1.0);

      return { dataUrl: fullDataUrl, ocrDataUrl };
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

            // Generamos una segunda versión recortada (solo el 70% inferior) para el OCR.
            const ocrCanvas = document.createElement('canvas');
            const ocrCtx = ocrCanvas.getContext('2d');
            const cropHeight = height * 0.7;
            const cropY = height - cropHeight;
            ocrCanvas.width = width;
            ocrCanvas.height = cropHeight;
            ocrCtx.drawImage(canvas, 0, cropY, width, cropHeight, 0, 0, width, cropHeight);
            
            const ocrDataUrl = ocrCanvas.toDataURL('image/jpeg', 1.0);
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

            setPreviewUrl(dataUrl);
            processReceipt(dataUrl, null, ocrDataUrl);
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
            processReceipt(result.dataUrl, null, result.ocrDataUrl); // Pasamos imagen completa y recortada
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
          // Usar la imagen recortada si existe, sino la completa
          const targetImage = ocrDataUrl || dataUrl;
          
          const worker = await Tesseract.createWorker('spa');
          await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          });
          const result = await worker.recognize(targetImage);
          await worker.terminate();
          
          // Normalizar el texto: quitar espacios, guiones, saltos, y tratar O/0 I/1 S/5 como iguales
          const normalizeStr = (str) => String(str).toUpperCase()
            .replace(/[\s\-\_]/g, '')
            .replace(/O/g, '0')
            .replace(/I/g, '1')
            .replace(/S/g, '5');

          textNorm = normalizeStr(result.data.text);
          console.log("Texto extraído normalizado:", textNorm);

          const isFuzzyMatch = (target, text, maxTypos = 4) => {
            if (!target || target.length < 10) return text.includes(target);
            for (let i = 0; i <= text.length - target.length; i++) {
              let typos = 0;
              for (let j = 0; j < target.length; j++) {
                if (text[i+j] !== target[j]) typos++;
                if (typos > maxTypos) break;
              }
              if (typos <= maxTypos) return true;
            }
            return false;
          };

          // Cruce: buscamos si algún N° de Operación o COELSA ID de MP existe en el texto leído
          matchedTransfer = mercadoPagoTransfers?.find(t => {
            const numOpNorm = normalizeStr(t.numeroOperacion);
            const coelsaNorm = t.coelsaId ? normalizeStr(t.coelsaId) : null;
            
            // El número de operación de MP es corto (11 números), exigimos coincidencia exacta o 1 typo
            if (isFuzzyMatch(numOpNorm, textNorm, 1)) return true;
            // El COELSA ID es largo (22 alfanuméricos), permitimos hasta 4 typos por errores de OCR
            if (coelsaNorm && isFuzzyMatch(coelsaNorm, textNorm, 4)) return true;
            
            // Fallback por Fecha y Hora (Si extrae "24/7/26, 12:11" del comprobante y existe en MP)
            if (t.fecha) {
              // t.fecha viene como "24/7/2026, 12:11"
              // Buscamos si los números clave de esa fecha (dia, mes, hora, minuto) aparecen muy cerca en el texto leído
              const [datePart, timePart] = t.fecha.split(', ');
              if (datePart && timePart) {
                 const [day, month] = datePart.split('/');
                 const [hour, min] = timePart.split(':');
                 const dayMonthRegex = new RegExp(`\\b${day}\\s*[/\\-]\\s*0?${month}\\b`);
                 const timeRegex = new RegExp(`\\b${hour}\\s*:\\s*${min}\\b`);
                 
                 // Si el texto incluye la misma fecha (día/mes) y la misma hora exacta (hora:min)
                 if (dayMonthRegex.test(textNorm) && timeRegex.test(textNorm)) {
                   return true;
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
            // Intentar extraer monto y nombres usando expresiones regulares (fallback para comprobantes externos a MP)
            const montoMatch = textNorm.match(/\$ ?([\d.,]+)/);
            const montoExtraido = montoMatch ? `$${montoMatch[1]}` : 'Desconocido';
            
            // Intentar extraer Fecha/Hora del texto leído (Ej: 24/7/26 12:11)
            const dateMatch = textNorm.match(/(?:^|\D)(\d{1,2}[/\\-]\d{1,2}(?:[/\\-]\d{2,4})?)(?:\D|$)/);
            const timeMatch = textNorm.match(/(?:^|\D)(\d{1,2}:\d{2})(?:\D|$)/);
            
            const fechaExtraida = dateMatch ? dateMatch[1] : null;
            const horaExtraida = timeMatch ? timeMatch[1] : null;
            
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
            autoObservaciones = `Requiere revisión manual. No se detectó coincidencia exacta.\nDatos extraídos:\n- Fecha: ${fechaExtraida ? fechaExtraida : '❌'}\n- Hora: ${horaExtraida ? horaExtraida : '❌'}\n- Monto: ${montoExtraido ? '$' + montoExtraido : '❌'}`;
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
