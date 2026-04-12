import { supabase } from './supabaseClient';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  debt_initial?: number | null;
}

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    let all: Customer[] = [];
    let from = 0;
    const pageSize = 1000;
    let keepGoing = true;
    while (keepGoing) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')
        .range(from, from + pageSize - 1);
      if (error) {
        console.warn('Error fetching customers:', error);
        return all;
      }
      if (data && data.length > 0) {
        all = all.concat(data);
        if (data.length < pageSize) keepGoing = false;
        else from += pageSize;
      } else {
        keepGoing = false;
      }
    }
    return all;
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
