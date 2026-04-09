import { supabase } from './supabaseClient';

export interface CashClosing {
  id: string;
  user_id: string | null;
  open_amount: number;
  close_amount: number | null;
  date_open: string;
  date_close: string | null;
  total_sales: number;
  total_products: number;
  sales_details: any;
  status: 'open' | 'closed';
  cantidad_ventas?: number;
  total_ventas?: number;
  cantidad_pedidos?: number;
  total_pedidos?: number;
  cantidad_presupuestos?: number;
  total_presupuestos?: number;
  cobrado_efectivo?: number;
  cobrado_digital?: number;
  cobrado_mercadopago?: number;
  cobrado_transferencia?: number;
  cobrado_tarjeta?: number;
  efectivo_esperado?: number;
  monto_real_caja?: number;
  diferencia_caja?: number;
}

export const cashService = {
  async getCurrentSession(userId?: string): Promise<CashClosing | null> {
    let query = supabase
      .from('cash_closings')
      .select('*')
      .eq('status', 'open');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('date_open', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current cash session:', error);
    }
    return data || null;
  },

  async openSession(amount: number, userId?: string): Promise<CashClosing> {
    const { data, error } = await supabase
      .from('cash_closings')
      .insert([{ 
        open_amount: amount, 
        status: 'open', 
        user_id: userId || null 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async closeSession(id: string, closeAmount: number, summary: any): Promise<CashClosing> {
    const { data, error } = await supabase
      .from('cash_closings')
      .update({
        close_amount: closeAmount,
        status: 'closed',
        date_close: new Date().toISOString(),
        total_sales: summary.total_sales,
        total_products: summary.total_products,
        sales_details: summary.sales_details,
        cantidad_ventas: summary.cantidad_ventas,
        total_ventas: summary.total_ventas,
        cantidad_pedidos: summary.cantidad_pedidos,
        total_pedidos: summary.total_pedidos,
        cantidad_presupuestos: summary.cantidad_presupuestos,
        total_presupuestos: summary.total_presupuestos,
        cobrado_efectivo: summary.cobrado_efectivo,
        cobrado_digital: summary.cobrado_digital,
        cobrado_mercadopago: summary.cobrado_mercadopago,
        cobrado_transferencia: summary.cobrado_transferencia,
        cobrado_tarjeta: summary.cobrado_tarjeta,
        efectivo_esperado: summary.efectivo_esperado,
        monto_real_caja: summary.monto_real_caja,
        diferencia_caja: summary.diferencia_caja
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
