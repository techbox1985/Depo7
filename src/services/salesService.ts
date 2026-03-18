import { supabase } from './supabaseClient';
import { CartItem, Sale } from '../types';

export const salesService = {
  async createSale(items: CartItem[], total: number, customerId?: string, status: 'completada' | 'pendiente' | 'presupuesto' = 'completada'): Promise<Sale> {
    const payload = {
      p_total: total,
      p_cliente_id: customerId || null,
      p_estado: status,
      p_items: items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        original_price: item.originalPrice
      }))
    };

    // Since we might not have updated the RPC yet, we'll try the new one, and fallback to the old one if it fails
    // If we fallback to the old one, we'll manually update the status if it's not 'completed'
    // and we'll have to manually revert stock if it's a quote or pending, which is tricky.
    // The best approach is to assume the RPC is updated, but if it fails with signature mismatch,
    // we fallback to the old RPC and then update the status via a direct update.
    
    let saleId = 'unknown';
    
    try {
      const { data, error } = await supabase.rpc('create_sale_with_status', payload);
      if (error) throw error;
      saleId = data?.codigo_venta || 'unknown';
    } catch (e: any) {
      console.warn('create_sale_with_status failed, falling back to create_sale', e);
      
      // Fallback to old RPC
      const fallbackPayload = {
        p_total: total,
        p_cliente_id: customerId || null,
        p_items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          original_price: item.originalPrice
        }))
      };
      
      const { data, error } = await supabase.rpc('create_sale', fallbackPayload);
      if (error) {
        throw new Error(`Error al procesar la venta: ${error.message}`);
      }
      
      saleId = data?.codigo_venta || 'unknown';
      
      // If status is not completed, we need to update the status and revert stock
      if (status !== 'completada' && saleId !== 'unknown') {
        try {
          // Update status
          await supabase.from('sales').update({ estado: status }).eq('codigo_venta', saleId);
          
          // Revert stock since the old RPC deducted it
          for (const item of items) {
            const { data: product } = await supabase.from('products').select('stock').eq('id', item.product.id).single();
            if (product) {
              await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product.id);
            }
          }
        } catch (updateError) {
          console.error('Error updating status or reverting stock:', updateError);
        }
      }
    }

    return {
      id: saleId,
      codigo_venta: saleId,
      cliente_id: customerId || null,
      caja_id: null,
      total,
      estado: status,
      metodo_pago: 'efectivo',
      tipo_digital: null,
      cuotas: null,
      monto_efectivo: total,
      monto_digital: 0,
      tipo_descuento: 'ninguno',
      valor_descuento: 0,
      price_list: null,
      total_productos: items.reduce((acc, item) => acc + item.quantity, 0),
      fecha: new Date().toISOString(),
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    };
  }
};
