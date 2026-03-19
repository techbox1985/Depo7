import { supabase } from './supabaseClient';
import { CartItem, Sale } from '../types';
import { offlineDb } from './offlineDb';

export const salesService = {
  async createSale(items: CartItem[], total: number, customerId?: string, status: 'completada' | 'pendiente' | 'presupuesto' = 'completada'): Promise<Sale> {
    const client_txn_id = crypto.randomUUID();
    
    if (navigator.onLine) {
      try {
        return await this.createSaleSupabase(items, total, customerId, status);
      } catch (e) {
        console.warn('Supabase create sale failed, saving offline', e);
      }
    }
    
    await offlineDb.saveSale({ client_txn_id, items, total, customerId, status, createdAt: new Date().toISOString() });
    return { id: client_txn_id, codigo_venta: client_txn_id, estado: status, total } as any;
  },

  async createSaleSupabase(items: CartItem[], total: number, customerId?: string, status: 'completada' | 'pendiente' | 'presupuesto' = 'completada'): Promise<Sale> {
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

    const { data, error } = await supabase.rpc('create_sale_with_status', payload);
    if (error) throw error;
    return { id: data?.codigo_venta || 'unknown', ...payload, estado: status } as any;
  }
};
