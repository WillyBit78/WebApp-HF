export const ocrService = {
  /**
   * Extrae datos clave de una imagen de comprobante de transferencia
   * @param {string} imageUrl - URL o Base64 de la imagen
   */
  async extractPaymentData(imageUrl) {
    try {
      let rawText = '';
      if (!window.Tesseract && typeof document !== 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = resolve; // Continue on error
          document.head.appendChild(script);
        });
      }

      if (window.Tesseract) {
        const { data } = await window.Tesseract.recognize(imageUrl, 'spa', {
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
    const matches = text.match(/\$?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g);
    if (matches) {
      for (const m of matches) {
        const clean = m.replace(/[$\s]/g, '');
        if (clean.includes('.')) {
          const num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
          if (num >= 1000) return num;
        } else if (clean.includes(',')) {
          const num = parseFloat(clean.replace(',', '.'));
          if (num >= 1000) return num;
        }
      }
    }
    return null;
  },

  parseDate(text) {
    if (!text) return null;
    const match = text.match(/\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/);
    return match ? match[1] : null;
  },

  parseTime(text) {
    if (!text) return null;
    const match = text.match(/\b(\d{1,2}:\d{2}(?:\s?[ap]\.?m\.?|\s?hs\.?)?)\b/i);
    return match ? match[1] : null;
  },

  parseOperationId(text) {
    if (!text) return null;
    const opRegex = /(?:Nº|N°|Número|Num|ID)?\s*(?:de|da)?\s*(?:la)?\s*(?:operación|operacion|comprobante|transaccion)[:\s]+(\d{7,14})/i;
    const match = text.match(opRegex);
    if (match) return match[1];

    const numMatches = text.match(/\b(\d{8,12})\b/g);
    if (numMatches) {
      for (const nm of numMatches) {
        if (nm.length >= 8 && nm.length <= 12 && !nm.startsWith('20') && !nm.startsWith('27') && !nm.startsWith('30')) {
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
    return null;
  }
};