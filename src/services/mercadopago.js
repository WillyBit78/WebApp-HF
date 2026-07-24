/**
 * Servicio de integración con la API Oficial de Mercado Pago
 * Especializado en la lectura de Transferencias Recibidas de Cuenta Personal a Cuenta Personal (Money In / CVU / Alias).
 */
export async function fetchMercadoPagoTransfers(accessToken) {
  if (!accessToken) {
    console.warn('Mercado Pago Access Token no configurado.');
    return [];
  }

  try {
    // Consulta a la API de Mercado Pago filtrando por transferencias de dinero recibidas
    const response = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error MP API (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    
    // Filtrar y transformar transferencias entrantes (Money Transfer / Bank Transfer / Deposit)
    return (data.results || []).map(p => {
      const esTransferenciaPersonal = 
        p.operation_type === 'money_transfer' || 
        p.payment_type_id === 'bank_transfer' || 
        p.payment_type_id === 'account_money' ||
        p.description?.toLowerCase().includes('transferencia');

      return {
        id: `mp-tx-${p.id}`,
        numeroOperacion: String(p.id),
        coelsaId: p.point_of_interaction?.transaction_data?.bank_transfer_id || p.point_of_interaction?.transaction_data?.transaction_id || null,
        emisorNombre: p.payer ? `${p.payer.first_name || ''} ${p.payer.last_name || 'Transferencia Recibida'}`.trim() : 'Transferencia Recibida',
        billeteraOrigen: p.payment_method_id ? p.payment_method_id.toUpperCase() : (p.point_of_interaction?.type || 'Billetera Virtual / Banco'),
        monto: p.transaction_amount || 0,
        fecha: new Date(p.date_created).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
        estado: p.status === 'approved' ? 'sin_vincular' : p.status,
        tipoOperacion: p.operation_type || 'money_transfer',
        detallesMP: p.reason || p.description || 'Transferencia entre cuentas personales (CVU/Alias)'
      };
    });

  } catch (err) {
    console.error('Error obteniendo transferencias personales en vivo de Mercado Pago:', err);
    return [];
  }
}
