import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, CheckCircle2, Sparkles, ArrowRight, CreditCard, Clock, User } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ocrService } from '../services/ocrService';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js usando CDN para evitar problemas de Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const PaymentUploader = ({ onSuccess }) => {
  const { 
    uploadPaymentReceipt, 
    clubSettings, 
    currentUser, 
    users = [],
    logout,
    mercadoPagoTransfers, 
    payments, 
    vincularTransferenciaMP, 
    sincronizarMercadoPago,
    registrarLog 
  } = useApp();
  
  const cardRef = React.useRef(null);

  // Obtener usuarios: los del dispositivo primero, y luego todos los del club con su categoría
  const getDeviceUsers = () => {
    let deviceUserIds = [];
    try {
      const stored = localStorage.getItem('haedo_device_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) deviceUserIds = parsed.map(p => p.id);
      }
    } catch (e) {}

    const deviceList = users.filter(u => deviceUserIds.includes(u.id));
    const otherList = users.filter(u => !deviceUserIds.includes(u.id));

    const combined = [...deviceList, ...otherList];
    return combined.length > 0 ? combined : [currentUser];
  };

  const deviceUsersList = getDeviceUsers();
  const defaultUser = deviceUsersList.find(u => u.id === localStorage.getItem('haedo_last_user_id')) || currentUser;
  
  const [selectedSocioId, setSelectedSocioId] = useState(defaultUser?.id || currentUser?.id);
  const targetSocio = users.find(u => u.id === selectedSocioId) || currentUser;

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pendingDataUrl, setPendingDataUrl] = useState(null);
  const [pendingSample, setPendingSample] = useState(null);
  const [isSharedReceipt, setIsSharedReceipt] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'aprobado' | 'en_revision'
  const [step, setStep] = useState(1); // 1: upload/sample, 3: success (step 2 removed)

  // Auto-scroll centrado al montar o recibir un comprobante
  React.useEffect(() => {
    if (cardRef.current) {
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pendingDataUrl, step]);

  React.useEffect(() => {
    const checkSharedFile = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('shared-receipts');
          let response = await cache.match('/shared-receipt-file') || await cache.match('/shared-receipt.jpg');
          if (response) {
            const blob = await response.blob();
            const headerType = response.headers.get('Content-Type');
            const headerName = response.headers.get('X-File-Name');
            
            const isPdf = (headerType && headerType.includes('pdf')) || (blob.type && blob.type.includes('pdf')) || (headerName && headerName.toLowerCase().endsWith('.pdf'));
            const finalMime = isPdf ? 'application/pdf' : (blob.type || 'image/jpeg');
            const fileName = headerName || (isPdf ? 'comprobante_compartido.pdf' : 'comprobante_compartido.jpg');
            
            const sharedFile = new File([blob], fileName, { type: finalMime });
            
            await cache.delete('/shared-receipt-file').catch(() => {});
            await cache.delete('/shared-receipt.jpg').catch(() => {});
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setIsSharedReceipt(true);
            handlePrepareFile(sharedFile);
          }
        }
      } catch (e) {
        console.error("Error loading shared file:", e);
      }
    };
    checkSharedFile();
  }, []);

  const sampleReceipts = [
    {
      name: 'Comprobante MP (Simular Aprobado)',
      monto: 15000,
      numeroOperacion: '9841029481',
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
      const viewport = page.getViewport({ scale: 2.0 });
      
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

  const handlePrepareFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setPendingSample(null);
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
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
          setPreviewUrl(dataUrl);
          setPendingDataUrl(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const arrayBuffer = reader.result;
        const result = await convertPdfToImage(arrayBuffer);
        
        if (result && result.dataUrl) {
          setPreviewUrl(result.dataUrl);
          setPendingDataUrl(result.dataUrl);
        } else {
          const fallbackReader = new FileReader();
          fallbackReader.onloadend = () => {
            setPreviewUrl(fallbackReader.result);
            setPendingDataUrl(fallbackReader.result);
          };
          fallbackReader.readAsDataURL(selectedFile);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setPendingDataUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setIsSharedReceipt(false);
      handlePrepareFile(selectedFile);
    }
  };

  const handleSelectSample = (sample) => {
    setFile({ name: `${sample.billeteraOrigen}_Comprobante.jpg` });
    const sampleUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80';
    setPreviewUrl(sampleUrl);
    setPendingDataUrl(sampleUrl);
    setPendingSample(sample);
  };

  const processReceipt = async (dataUrl, sampleOverride, ocrDataUrl = null) => {
    setParsing(true);
    
    try {
      let finalStatus = 'en_revision';
      let autoObservaciones = 'Comprobante subido desde app.';
      let extractedNumeroOperacion = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      let matchedTransfer = null;
      let fechaExtraida = null;
      let horaExtraida = null;
      let montoExtraido = null;

      if (sampleOverride) {
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
        if (dataUrl.includes('application/pdf')) {
          finalStatus = 'en_revision';
          autoObservaciones = 'Comprobante en formato PDF. Requiere revisión manual visual.';
        } else {
          let geminiResult = {};
          let ocrClientResult = {};

          // 1. Ejecutar OCR Cliente (Tesseract en navegador + Regex)
          try {
            if (ocrService && typeof ocrService.extractPaymentData === 'function') {
              ocrClientResult = await ocrService.extractPaymentData(dataUrl);
            }
          } catch (errOcr) {
            console.warn("Error en OCR cliente:", errOcr);
          }

          // 2. Ejecutar Gemini si hay API Key disponible
          try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
            if (apiKey) {
              const genAI = new GoogleGenerativeAI(apiKey);
              let model;
              try {
                model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
              } catch (err) {
                model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
              }

              const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,/);
              const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
              const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

              const imageParts = [{
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }];

              const prompt = `Analizá la imagen de este comprobante bancario / billetera virtual y extraé en JSON puro los datos:
{
  "fecha": "DD/MM/YYYY",
  "hora": "HH:MM",
  "monto": 15000,
  "coelsa_id": "código alfanumérico largo o null",
  "numero_operacion": "número de comprobante/operación o null",
  "emisor": "Nombre del pagador/titular de origen"
}`;

              const result = await model.generateContent([prompt, ...imageParts]);
              const response = await result.response;
              let text = response.text();
              
              let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').replace(/\/\/.*$/gm, '').trim();
              const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                geminiResult = JSON.parse(jsonMatch[0]);
              } else {
                geminiResult = JSON.parse(cleanedText);
              }
            }
          } catch (e) {
            console.warn("Gemini OCR no disponible:", e);
          }

          // Fusionar resultados (Gemini con mayor prioridad, Tesseract como respaldo sólido)
          fechaExtraida = geminiResult.fecha || ocrClientResult.fecha || null;
          horaExtraida = geminiResult.hora || ocrClientResult.hora || null;
          montoExtraido = geminiResult.monto ? Number(geminiResult.monto) : (ocrClientResult.monto ? Number(ocrClientResult.monto) : null);
          
          let extractedCoelsa = ocrClientResult.coelsa_id || geminiResult.coelsa_id || '';
          if (extractedCoelsa && (!/[A-Z]/i.test(extractedCoelsa) || !/[0-9]/.test(extractedCoelsa))) {
            extractedCoelsa = ''; // El COELSA ID debe ser ALFANUMÉRICO (no únicamente numérico como CBU)
          }

          let extractedNumOp = geminiResult.numero_operacion || ocrClientResult.numero_operacion || '';
          if (extractedNumOp) {
            const numOnly = String(extractedNumOp).replace(/[^0-9]/g, '');
            if (numOnly.length >= 7 && numOnly.length <= 14) {
              extractedNumOp = numOnly;
            } else if (!/^\d+$/.test(extractedNumOp)) {
              extractedNumOp = '';
            }
          }

          let emisorExtraido = geminiResult.emisor || ocrClientResult.emisor || null;
          if (emisorExtraido) {
            emisorExtraido = String(emisorExtraido).replace(/\s+(CUIL|CUIT|DNI|Desde|Recibe|Personal|Mercado|Banco|Billetera).*$/i, '').trim();
          }

          // Armar Informe de Auditoría Detallado sin encabezados redundantes
          const leidos = [];
          const faltantes = [];

          if (montoExtraido) leidos.push(`Monto: $${montoExtraido.toLocaleString('es-AR')}`); else faltantes.push('Monto');
          if (fechaExtraida) leidos.push(`Fecha: ${fechaExtraida}`); else faltantes.push('Fecha');
          if (horaExtraida) leidos.push(`Hora: ${horaExtraida}`); else faltantes.push('Hora');
          if (extractedCoelsa) leidos.push(`COELSA ID: ${extractedCoelsa}`); else faltantes.push('COELSA ID');
          if (extractedNumOp) leidos.push(`N° Operación: ${extractedNumOp}`); else faltantes.push('N° Operación');
          if (emisorExtraido) leidos.push(`Nombre Emisor: ${emisorExtraido}`); else faltantes.push('Nombre Emisor');

          const leidosTxt = leidos.length > 0 ? leidos.join(' | ') : 'Sin datos estructurados';
          const faltantesTxt = faltantes.length > 0 ? faltantes.join(', ') : 'Ninguno';

          // Sincronizar transferencias frescas de Mercado Pago
          let mpList = mercadoPagoTransfers || [];
          if (typeof sincronizarMercadoPago === 'function') {
            const freshMP = await sincronizarMercadoPago();
            if (Array.isArray(freshMP) && freshMP.length > 0) {
              mpList = freshMP;
            }
          }

          // Cruce inteligente
          const cleanStr = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          matchedTransfer = mpList?.find(t => {
            const numOpNorm = cleanStr(t.numeroOperacion);
            const coelsaNorm = cleanStr(t.coelsaId);
            
            if (extractedCoelsa.length > 5 && coelsaNorm && (coelsaNorm.includes(extractedCoelsa) || extractedCoelsa.includes(coelsaNorm))) return true;
            if (extractedNumOp.length > 5 && numOpNorm && (numOpNorm.includes(extractedNumOp) || extractedNumOp.includes(numOpNorm))) return true;
            
            if (t.fecha && fechaExtraida && horaExtraida) {
               const tStr = String(t.fecha);
               const gDateNums = String(fechaExtraida).match(/\d+/g) || [];
               if (gDateNums.length >= 2 && tStr.includes(gDateNums[0]) && tStr.includes(gDateNums[1])) return true;
            }
            return false;
          });

          if (matchedTransfer) {
            extractedNumeroOperacion = matchedTransfer.coelsaId ? matchedTransfer.coelsaId : matchedTransfer.numeroOperacion;
            
            const isDuplicate = payments.some(p => 
               String(p.numeroOperacion) === String(extractedNumeroOperacion) && 
               (p.estado === 'aprobado' || p.estado === 'en_revision')
            );

            if (isDuplicate || matchedTransfer.estado_conciliacion === 'conciliado') {
               finalStatus = 'rechazado';
               autoObservaciones = `✓ DATOS LEÍDOS POR OCR: ${leidosTxt}\n❌ FALTANTES O SIN COINCIDENCIA MP: ${faltantesTxt}\n⚠️ RECHAZADO: Comprobante duplicado o ya conciliado.`;
            } else {
               const requestedMonto = clubSettings.montoCuotaGeneral || 15000;
               if (Number(matchedTransfer.monto) !== Number(requestedMonto) && !sampleOverride) {
                 finalStatus = 'en_revision';
                 autoObservaciones = `✓ DATOS LEÍDOS POR OCR: ${leidosTxt}\n❌ FALTANTES O SIN COINCIDENCIA MP: ${faltantesTxt}\n⚠️ REVISIÓN: El monto MP ($${matchedTransfer.monto}) difiere de la cuota ($${requestedMonto}).`;
               } else {
                 finalStatus = 'aprobado';
                 autoObservaciones = `✓ DATOS LEÍDOS POR OCR: ${leidosTxt}\n✅ APROBADO: Coincidencia 100% con Mercado Pago (Emisor: ${matchedTransfer.emisorNombre}).`;
               }
            }
          } else {
            let isDuplicate = false;
            if (fechaExtraida && horaExtraida) {
               isDuplicate = payments.some(p => {
                 if (p.estado !== 'aprobado' && p.estado !== 'en_revision') return false;
                 const obsText = (p.observaciones || '').toLowerCase();
                 return obsText.includes(fechaExtraida) && obsText.includes(horaExtraida) && p.socioId === targetSocio.id;
               });
            }

            if (isDuplicate) {
               finalStatus = 'rechazado';
               autoObservaciones = `✓ DATOS LEÍDOS POR OCR: ${leidosTxt}\n❌ FALTANTES O SIN COINCIDENCIA MP: ${faltantesTxt}\n⚠️ RECHAZADO: Re-envío detectado. Misma fecha/hora ya registrada para este socio.`;
            } else {
               finalStatus = 'en_revision';
               autoObservaciones = `✓ DATOS LEÍDOS POR OCR: ${leidosTxt}\n❌ FALTANTES O SIN COINCIDENCIA MP: ${faltantesTxt}`;
            }
          }
        }
      }

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
        monto: montoExtraido || clubSettings.montoCuotaGeneral || 15000,
        numeroOperacion: extractedNumeroOperacion,
        billeteraOrigen: matchedTransfer ? matchedTransfer.billeteraOrigen : 'Desconocida',
        emisorNombre: matchedTransfer ? matchedTransfer.emisorNombre : `${targetSocio.nombre} ${targetSocio.apellido}`,
        fechaTransferencia: matchedTransfer ? matchedTransfer.fecha : parseDateAR(fechaExtraida),
        observaciones: autoObservaciones
      };

      setPaymentStatus(finalStatus);

      const paymentData = await uploadPaymentReceipt({
        ...parsedData,
        estado: finalStatus,
        observaciones: autoObservaciones,
        comprobanteUrl: dataUrl
      }, targetSocio);
      
      if (finalStatus === 'aprobado' && matchedTransfer && paymentData?.id) {
         if (typeof vincularTransferenciaMP === 'function') {
           vincularTransferenciaMP(matchedTransfer.id, paymentData.id, matchedTransfer);
         }
      }

      setParsing(false);
      setStep(3);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (error) {
      console.error("Error en OCR:", error);
      if (typeof registrarLog === 'function') {
        registrarLog('error_critico_ocr', `Error procesando comprobante`, error.message);
      }
      setPaymentStatus('en_revision');
      await uploadPaymentReceipt({
        monto: clubSettings.montoCuotaGeneral || 15000,
        numeroOperacion: `MANUAL-${Date.now().toString().slice(-6)}`,
        billeteraOrigen: 'Desconocida',
        emisorNombre: `${targetSocio.nombre} ${targetSocio.apellido}`,
        observaciones: 'INFORME DE AUDITORÍA DE CONTABILIDAD:\n✓ DATOS LEÍDOS POR OCR: Sin datos estructurados\n❌ FALTANTES O SIN COINCIDENCIA MP: Monto, Fecha, Hora, COELSA ID, N° Operación, Nombre Emisor',
        estado: 'en_revision',
        comprobanteUrl: dataUrl
      }, targetSocio).catch(console.warn);

      setParsing(false);
      setStep(3);
    }
  };

  return (
    <div ref={cardRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white">Reportar Pago de Cuota</h3>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {pendingDataUrl ? (
            <div className="space-y-4 animate-fadeIn">
              {isSharedReceipt && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-lg shadow-emerald-500/5">
                  <Sparkles className="w-5 h-5 shrink-0 text-emerald-400 animate-pulse" />
                  <div className="font-bold text-emerald-300">📥 ¡Comprobante recibido desde tu billetera!</div>
                </div>
              )}

              {/* Selector de Socio Destino con Categoría para Identificarlo */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    Acreditar este comprobante a:
                  </span>
                  {logout && (
                    <button 
                      type="button" 
                      onClick={() => logout()}
                      className="text-[11px] text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                    >
                      🔒 Cambiar de Usuario
                    </button>
                  )}
                </div>
                <select
                  value={selectedSocioId}
                  onChange={(e) => setSelectedSocioId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-3 text-sm font-extrabold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                >
                  {deviceUsersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido} {u.categoria ? `(${u.categoria})` : (u.rol ? `(${u.rol})` : '(Socio)')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl text-center">
                 <div className="text-slate-400 text-xs font-bold mb-1">Monto a Acreditar ({targetSocio.nombre}):</div>
                 <div className="text-3xl font-black text-emerald-400">
                   ${(targetSocio.montoCuota || clubSettings.montoCuotaGeneral || 15000).toLocaleString('es-AR')}
                 </div>
              </div>

              <button
                type="button"
                onClick={() => processReceipt(pendingDataUrl, pendingSample)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                Confirmar y Procesar Comprobante para {targetSocio.nombre}
              </button>
            </div>
          ) : (
            <>
              {/* Botones de simulación para pruebas rápidas */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>⚡ Pruebas Rápidad / Simulador de Comprobantes</span>
                  <span className="text-[10px] text-slate-500 font-mono">Modo Dev</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleReceipts.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs font-bold text-left border border-slate-700 flex items-center justify-between group transition-all cursor-pointer"
                    >
                      <span className="truncate">{s.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Socio Destino con Categoría */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    Acreditar este comprobante a:
                  </span>
                  {logout && (
                    <button 
                      type="button" 
                      onClick={() => logout()}
                      className="text-[11px] text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                    >
                      🔒 Cambiar de Usuario
                    </button>
                  )}
                </div>
                <select
                  value={selectedSocioId}
                  onChange={(e) => setSelectedSocioId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-3 text-sm font-extrabold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
                >
                  {deviceUsersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido} {u.categoria ? `(${u.categoria})` : (u.rol ? `(${u.rol})` : '(Socio)')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-xl text-center">
                 <div className="text-slate-400 font-medium mb-1">Monto a Pagar ({targetSocio.nombre}):</div>
                 <div className="text-4xl font-black text-emerald-400">
                   ${(targetSocio.montoCuota || clubSettings.montoCuotaGeneral || 15000).toLocaleString('es-AR')}
                 </div>
              </div>

              <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <div className="p-4 bg-slate-800 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-400 text-slate-400 mb-3 transition-all">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="font-bold text-base text-slate-200">Subir Comprobante (Imagen o PDF)</span>
                <span className="text-xs text-slate-500 mt-2 text-center max-w-[220px]">Soporta capturas JPG, PNG, WEBP y comprobantes en PDF de Mercado Pago o Bancos</span>
              </label>
            </>
          )}
        </div>
      )}

      {parsing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-5 flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-red-500 border-r-amber-400 animate-spin"></div>
              <div className="w-16 h-16 rounded-full bg-slate-950 p-2 border border-slate-700 shadow-inner flex items-center justify-center z-10">
                <img 
                  src="/escudo.png" 
                  alt="Haedo Futsal" 
                  className="w-12 h-12 object-contain drop-shadow"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-12 h-12 rounded-full bg-red-600 text-white font-black items-center justify-center text-xs">
                  HF
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                Analizando Comprobante
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Verificando la validez del comprobante y conciliando la cuota de <strong>{targetSocio.nombre}</strong>...
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 via-amber-400 to-red-500 h-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && paymentStatus === 'aprobado' && (
        <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="font-black text-2xl text-emerald-400 tracking-tight">¡Aceptada y Verificada!</h4>
          <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            Hemos validado el pago automáticamente con éxito. La cuenta corriente de <strong>{targetSocio.nombre}</strong> se ha actualizado a estado <strong>Al Día</strong>.
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
            Hemos recibido el comprobante para <strong>{targetSocio.nombre}</strong>. Necesita ser verificado manualmente por finanzas.
          </p>
        </div>
      )}
    </div>
  );
};
