import { supabase } from './supabaseClient';

export const expensesService = {
  async getExpensesByCajaId(cash_closing_id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('cash_closing_id', cash_closing_id);
    if (error) throw error;
    return data || [];
  },

  async createExpense({ concept, description, amount, cash_closing_id, user_id }: { concept: string; description: string; amount: number; cash_closing_id: string; user_id?: string }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          concept,
          description,
          amount,
          cash_closing_id,
          user_id,
          expense_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
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
