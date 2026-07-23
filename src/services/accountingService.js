"import { supabase } from '../lib/supabase';

export const accountingService = {
  /**
   * Registra un ingreso en la caja correspondiente y actualiza el saldo
   */
  async registerIncome(amount, category, subCategory = null, concept = '', comprovanteId = null) {
    const { data: caja, error: cajaError } = await supabase
      .from('cajas')
      .select('id, saldo_actual')
      .eq('nombre_sector', category)
      .single();

    if (cajaError) throw new Error('No se encontró la caja seleccionada');

    // 1. Registrar el movimiento en la tabla de movimientos_contables
    const { error: movError } = await supabase
      .from('movimientos_contables')
      .insert([{
        monto: amount,
        tipo: 'ingreso',
        categoria: category,
        sub_categoria: subCategory,
        concepto: concept,
        comprobante_id: comprovanteId,
        fecha: new Date().toISOString()
      }]);

    if (movError) throw movError;

    // 2. Actualizar el saldo en la tabla cajas
    const { error: updateError } = await supabase
      .from('cajas')
      .update({ saldo_actual: caja.saldo_actual + amount })
      .eq('id', caja.id);

    if (updateError) throw updateError;

    return true;
  },

  /**
   * Registra un egreso (gasto manual)
   */
  async registerExpense(amount, category, subCategory = null, concept = '') {
    const { data: caja, error: cajaError } = await supabase
      .from('cajas')
      .select('id, saldo_actual')
      .eq('nombre_sector', category)
      .single();

    if (cajaError) throw new Error('No se encontró la caja seleccionada');

    const { error: movError } = await supabase
      .from('movimientos_contables')
      .insert([{
        monto: amount,
        tipo: 'egreso',
        categoria: category,
        sub_categoria: subCategory,
        concepto: concept,
        fecha: new Date().toISOString()
      }]);

    if (movError) throw movError;

    const { error: updateError } = await supabase
      .from('cajas')
      .update({ saldo_actual: caja.saldo_actual - amount })
      .eq('id', caja.id);

    if (updateError) throw updateError;

    return true;
  }
};"