export const ocrService = {
  /**
   * Extrae datos clave de una imagen de comprobante de transferencia
   * @param {string} imageUrl - URL o Base64 de la imagen
   */
  async preprocessImage(imageUrl) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(imageUrl);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let w = img.width;
          let h = img.height;
          const maxDim = 1600;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          
          canvas.width = w;
          canvas.height = h;
          
          // Boost contrast and sharpen image to cut through screen moiré scan lines
          ctx.filter = 'contrast(1.4) brightness(1.05)';
          ctx.drawImage(img, 0, 0, w, h);
          
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch (e) {
          resolve(imageUrl);
        }
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  },

  async extractPaymentData(imageUrl) {
    try {
      let rawText = '';
      const processedUrl = await this.preprocessImage(imageUrl);

      if (!window.Tesseract && typeof document !== 'undefined') {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        });
      }

      if (window.Tesseract) {
        const { data } = await window.Tesseract.recognize(processedUrl, 'spa', {
          logger: m => console.log('Tesseract OCR:', m.status, m.progress)
        });
        rawText = data?.text || '';
      }
      
      return {
        fecha: this.parseDate(rawText),
        hora: this.parseTime(rawText),
        monto: this.parseAmount(rawText),
        numero_operacion: this.parseOperationId(rawText),
        coelsa_id: this.parseCoelsaId(rawText),
        emisor: this.parseEmisor(rawText),
        rawText: rawText
      };
    } catch (error) {
      console.warn('Error en ocrService fallback:', error);
      return {
        fecha: null,
        hora: null,
        monto: null,
        numero_operacion: null,
        coelsa_id: null,
        emisor: null,
        rawText: ''
      };
    }
  },

  parseAmount(text) {
    if (!text) return null;
    const matches = text.match(/\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g);
    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/[$\s]/g, '');
        if (clean.includes('.')) {
          const num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
          if (num >= 1000) return num;
        } else if (clean.includes(',')) {
          const num = parseFloat(clean.replace(',', '.'));
          if (num >= 1000) return num;
        } else {
          const num = parseFloat(clean);
          if (num >= 1000 && num <= 1000000) return num;
        }
      }
    }
    return null;
  },

  parseDate(text) {
    if (!text) return null;
    const match = text.match(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/);
    if (match) return match[1];

    const monthMap = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12' };
    const monthRegex = /\b(\d{1,2})\s*[\/\.-]?\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\b/i;
    const mMatch = text.match(monthRegex);
    if (mMatch) {
      const day = mMatch[1].padStart(2, '0');
      const month = monthMap[mMatch[2].toLowerCase().substring(0, 3)] || '07';
      const year = new Date().getFullYear();
      return `${day}/${month}/${year}`;
    }
    return null;
  },

  parseTime(text) {
    if (!text) return null;
    const match = text.match(/\b(\d{1,2}:\d{2}(?:\s?[ap]\.?m\.?|\s?hs\.?)?)\b/i);
    return match ? match[1] : null;
  },

  parseOperationId(text) {
    if (!text) return null;
    const opRegex = /(?:N[°º\.]*|Número|Num|ID)?\s*(?:de|da)?\s*(?:la)?\s*(?:operación|operacion|comprobante|transaccion)[:\s\n\r]+(\d{8,14})/i;
    const match = text.match(opRegex);
    if (match) return match[1];

    const numMatches = text.match(/\b(\d{10,14})\b/g);
    if (numMatches) {
      for (const nm of numMatches) {
        if (!nm.startsWith('0000') && !nm.startsWith('20') && !nm.startsWith('27') && !nm.startsWith('30')) {
          return nm;
        }
      }
    }
    return null;
  },

  parseCoelsaId(text) {
    if (!text) return null;
    
    // COELSA ID en Argentina es siempre ALFANUMÉRICO (letras + números, ej: 7L8GYKNX40Z81P7KNMPRZ5)
    // NUNCA debe ser puramente numérico (eso es CBU/CVU de 22 dígitos)
    const coelsaRegex = /(?:COELSA|CoelsaID|Referencia|Id Bancario)[:\s]+([A-Z0-9]{14,35})/i;
    const match = text.match(coelsaRegex);
    if (match) {
      const token = match[1].replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (/[A-Z]/.test(token) && /[0-9]/.test(token) && token.length >= 12) {
        return token;
      }
    }

    const tokens = text.replace(/[^A-Z0-9\s]/gi, ' ').split(/\s+/);
    for (const t of tokens) {
      const u = t.toUpperCase();
      if (u.length >= 16 && u.length <= 32 && /[A-Z]/.test(u) && /[0-9]/.test(u)) {
        return u;
      }
    }
    return null;
  },

  parseEmisor(text) {
    if (!text) return null;
    const emisorRegex = /(?:Envía|Envia|De|Emisor|Titular)[:\s]+([A-Za-zÁÉÍÓÚáéíóúÑñ\s,]{3,35})/i;
    const match = text.match(emisorRegex);
    if (match) {
      let clean = match[1].trim();
      clean = clean.replace(/\s+(CUIL|CUIT|DNI|Desde|Recibe|Personal|Mercado|Banco|Billetera).*$/i, '').trim();
      return clean;
    }

    const lines = text.split(/[\r\n]+/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes('transferencia recibida') && i > 0) {
        const candidate = lines[i - 1].trim();
        if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{5,35}$/.test(candidate) && !candidate.toLowerCase().includes('aprobado') && !candidate.toLowerCase().includes('monto')) {
          return candidate;
        }
      }
    }
    return null;
  }
};