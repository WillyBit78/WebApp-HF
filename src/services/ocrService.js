"import Tesseract from 'tesseract.js';

export const ocrService = {
  /**
   * Extrae datos clave de una imagen de comprobante de transferencia
   * @param {string} imageUrl - URL o Base64 de la imagen
   */
  async extractPaymentData(imageUrl) {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'spa', // Idioma español
        { logger: m => console.log(m) }
      );

      // Lógica de extracción mediante Regex para patrones comunes de MP y Bancos
      return {
        amount: this.parseAmount(text),
        operationId: this.parseOperationId(text),
        coelsaId: this.parseCoelsaId(text),
        rawText: text
      };
    } catch (error) {
      console.error('Error en ocrService:', error);
      throw error;
    }
  },

  parseAmount(text) {
    // Busca patrones como $ 15.000,00 o 15000.00
    const amountRegex = /\$?\s?(\d{1,3}(\.\d{3})*,\d{2})/g;
    const matches = text.match(amountRegex);
    if (matches) {
      return parseFloat(matches[0].replace(/[$\s.]/g, '').replace(',', '.'));
    }
    return null;
  },

  parseOperationId(text) {
    // Busca patrones comunes de IDs de operación o transferencias
    const opRegex = /(?:Operación|ID de operación|Número de operación):\s?([A-Z0-9-]+)/i;
    const match = text.match(opRegex);
    return match ? match[1] : null;
  },

  parseCoelsaId(text) {
    // Busca patrones específicos de COELSA o identificadores largos numéricos
    const coelsaRegex = /(?:COELSA|Referencia):\s?(\d{10,25})/i;
    const match = text.match(coelsaRegex);
    return match ? match[1] : null;
  }
};"