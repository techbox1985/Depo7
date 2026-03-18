import { supabase } from './supabaseClient';
import { Supplier } from '../types';

export const suppliersService = {
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
      
    if (error) {
      console.warn('Error fetching suppliers, table might not exist yet:', error);
      return [];
    }
    return data || [];
  },

  async addSupplier(name: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
