import { supabase } from './supabaseClient';

export const expensesService = {

  async getGeneralExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .is('cash_closing_id', null)
      .eq('origin_type', 'general_negocio')
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getExpensesByCajaId(cash_closing_id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('cash_closing_id', cash_closing_id)
      .eq('origin_type', 'pos_turno')
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createExpense({ concept, description, amount, payment_method, cash_closing_id, user_id, origin_type }: { concept: string; description: string; amount: number; payment_method: string; cash_closing_id?: string | null; user_id?: string; origin_type?: string }) {
    // Si es gasto general, cash_closing_id debe ser null SIEMPRE
    const realOriginType = origin_type ?? (cash_closing_id ? 'pos_turno' : 'general_negocio');
    const realCashClosingId = realOriginType === 'general_negocio' ? null : cash_closing_id;
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          concept,
          description,
          amount,
          payment_method,
          cash_closing_id: realCashClosingId,
          user_id,
          origin_type: realOriginType,
          expense_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, { concept, description, amount, payment_method }: { concept: string; description: string; amount: number; payment_method: string }) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ concept, description, amount, payment_method })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getAllExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
