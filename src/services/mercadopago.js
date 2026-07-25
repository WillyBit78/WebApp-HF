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
    // Consulta a la API de Mercado Pago buscando más historial (hasta 300 registros)
    let allResults = [];
    for (let offset = 0; offset < 300; offset += 100) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=100&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Error MP API (${response.status}): ${await response.text()}`);
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        allResults = allResults.concat(data.results);
      }
      if (!data.results || data.results.length < 100) break; // ya no hay más
    }
    
    // Filtrar estrictamente solo transferencias ENTRANTES aprobadas (Money In / CVU / Alias)
    const incomingTransfers = allResults.filter(p => {
      if (p.status !== 'approved') return false;

      const opType = (p.operation_type || '').toLowerCase();
      const typeId = (p.payment_type_id || '').toLowerCase();
      const desc = (p.description || p.reason || '').toLowerCase();

      // Excluir compras con tarjetas, pagos en point, pagos de servicios o salidas
      if (typeId === 'credit_card' || typeId === 'debit_card' || typeId === 'ticket') return false;
      if (desc.includes('compra') || desc.includes('pago de servicio') || desc.includes('recarga')) return false;

      // Incluir si es transferencia explícita o ingreso de dinero
      const isTransfer = 
        opType === 'money_transfer' || 
        opType === 'account_fund' ||
        typeId === 'bank_transfer' || 
        typeId === 'account_money' ||
        typeId === 'cvu' ||
        desc.includes('transfer') ||
        desc.includes('dinero') ||
        desc.includes('cvu');

      return isTransfer;
    });

    return incomingTransfers.map(p => {
      // Buscar el COELSA ID en todas las ubicaciones posibles donde Mercado Pago lo reporta (especialmente transaction_details)
      const rawCoelsa = 
        p.transaction_details?.transaction_id ||
        p.transaction_details?.bank_transfer_id?.toString() ||
        p.point_of_interaction?.transaction_data?.e2e_id ||
        p.point_of_interaction?.transaction_data?.bank_info?.origin?.id ||
        p.point_of_interaction?.transaction_data?.transaction_id ||
        p.point_of_interaction?.transaction_data?.bank_transfer_id?.toString() ||
        p.acquirer_reconciliation_id ||
        p.additional_info?.nsu ||
        p.metadata?.coelsa_id ||
        p.metadata?.e2e_id ||
        null;

      return {
        id: `mp-tx-${p.id}`,
        numeroOperacion: String(p.id),
        coelsaId: rawCoelsa ? String(rawCoelsa).trim() : null,
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
