/**
 * Servicio de integración con la API Oficial de Mercado Pago
 */
export async function fetchMercadoPagoTransfers(accessToken) {
  if (!accessToken) {
    console.warn('Mercado Pago Access Token no configurado.');
    return [];
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error MP API (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    
    // Transformar resultados de Mercado Pago al formato del club
    return (data.results || []).map(p => ({
      id: `mp-tx-${p.id}`,
      numeroOperacion: String(p.id),
      emisorNombre: p.payer ? `${p.payer.first_name || ''} ${p.payer.last_name || p.payer.email || 'Transferencia'}`.trim() : 'Transferencia Recibida',
      billeteraOrigen: p.payment_method_id ? p.payment_method_id.toUpperCase() : 'Mercado Pago',
      monto: p.transaction_amount || 0,
      fecha: new Date(p.date_created).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      estado: p.status === 'approved' ? 'sin_vincular' : p.status,
      detallesMP: p.reason || p.description || 'Transferencia a cuenta'
    }));

  } catch (err) {
    console.error('Error obteniendo transferencias en vivo de Mercado Pago:', err);
    return [];
  }
}
