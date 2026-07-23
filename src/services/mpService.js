"import { createClient } from '../lib/supabase';

// Credenciales configuradas (en producción estas irían a variables de entorno)
const MP_CONFIG = {
  accessToken: 'APP_USR-3322444120483456-062819-f186f817a6a28fd7251c13baaf3d014e-43153257',
  clientId: '3322444120483456'
};

export const mpService = {
  /**
   * Busca transferencias recibidas en la cuenta de MP.
   * @param {number} amount - Monto a buscar
   * @param {string} dateFrom - Fecha inicio (ISO)
   * @param {string} dateTo - Fecha fin (ISO)
   */
  async searchPayments(amount, dateFrom, dateTo) {
    try {
      // Nota: En una cuenta personal, Mercado Pago usa el endpoint de /v1/payments/search
      const response = await fetch(`https://api.mercadopago.com/v1/payments/search?filter=date_created_at=${dateFrom},${dateTo}`, {
        headers: {
          'Authorization': `Bearer ${MP_CONFIG.accessToken}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error buscando pagos');

      // Filtramos manualmente por monto ya que la API de search es limitada en filtros exactos
      return data.results.filter(p => Math.abs(p.transaction_amount - amount) < 0.01 && p.status === 'approved');
    } catch (error) {
      console.error('Error en mpService.searchPayments:', error);
      throw error;
    }
  },

  /**
   * Obtiene las últimas transferencias para el contador
   */
  async getRecentTransactions(hours = 48) {
    try {
      const dateTo = new Date().toISOString();
      const dateFrom = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc`, {
        headers: {
          'Authorization': `Bearer ${MP_CONFIG.accessToken}`
        }
      });
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error obteniendo transacciones recientes:', error);
      return [];
    }
  }
};"