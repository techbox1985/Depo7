import { supabase } from './supabaseClient';

export const expensesService = {
  async getExpensesByCajaId(cajaId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('caja_id', cajaId);
    if (error) throw error;
    return data || [];
  }
};
