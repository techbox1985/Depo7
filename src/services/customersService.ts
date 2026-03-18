import { supabase } from './supabaseClient';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
      
    if (error) {
      console.warn('Error fetching customers:', error);
      return [];
    }
    return data || [];
  }
};
