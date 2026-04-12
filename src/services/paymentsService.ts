import { supabase } from './supabaseClient';

export interface CustomerPayment {
  id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
  cash_closing_id?: string | null;
  created_by?: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
  customer?: any;
}

export const paymentsService = {
  async listPayments(): Promise<CustomerPayment[]> {
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*, customers(id, name)')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async createPayment(payment: Partial<CustomerPayment>): Promise<CustomerPayment> {
    // Normalizar cash_closing_id
    const normalized = {
      ...payment,
      cash_closing_id: payment.cash_closing_id === '' ? null : payment.cash_closing_id
    };
    const { data, error } = await supabase
      .from('customer_payments')
      .insert([normalized])
      .select('*, customers(id, name)')
      .single();
    if (error) throw error;
    return data;
  },
  async updatePayment(id: string, updates: Partial<CustomerPayment>): Promise<CustomerPayment> {
    // Normalizar cash_closing_id
    const normalized = {
      ...updates,
      cash_closing_id: updates.cash_closing_id === '' ? null : updates.cash_closing_id
    };
    const { data, error } = await supabase
      .from('customer_payments')
      .update(normalized)
      .eq('id', id)
      .select('*, customers(id, name)')
      .single();
    if (error) throw error;
    return data;
  },
  async deletePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
