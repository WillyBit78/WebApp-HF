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
    const opRegex = /(?:Nº|N°|Número|Num|ID)?\s*(?:de|da)?\s*(?:la)?\s*(?:operación|operacion|comprobante|transaccion)[:\s]+([A-Z0-9]{6,20})/i;
    const match = text.match(opRegex);
    if (match) return match[1];

    const numMatch = text.match(/\b(\d{9,12})\b/);
    return numMatch ? numMatch[1] : null;
  },

  parseCoelsaId(text) {
    if (!text) return null;
    const coelsaRegex = /(?:COELSA|CoelsaID|Referencia)[:\s]+([A-Z0-9]{12,35})/i;
    const match = text.match(coelsaRegex);
    if (match) return match[1];

    const longMatch = text.match(/\b([A-Z0-9]{20,32})\b/);
    return longMatch ? longMatch[1] : null;
  },

  parseEmisor(text) {
    if (!text) return null;
    const emisorRegex = /(?:Envía|Envia|De|Emisor|Titular)[:\s]+([A-Za-zÁÉÍÓÚáéíóúÑñ\s,]{3,35})/i;
    const match = text.match(emisorRegex);
    return match ? match[1].trim() : null;
  }
};