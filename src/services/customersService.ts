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
  },
  async addCustomer(customer: Partial<Customer>) {
    const { data, error } = await supabase.from('customers').insert([customer]).select();
    if (error) throw error;
    return data?.[0];
  },
  async updateCustomer(id: string, customer: Partial<Customer>) {
    const { data, error } = await supabase.from('customers').update(customer).eq('id', id).select();
    if (error) throw error;
    return data?.[0];
  },
  async deleteCustomer(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};
