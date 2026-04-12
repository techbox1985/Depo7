import { supabase } from './supabaseClient';

export const companySettingsService = {
  async getCompanySettings() {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },
  async updateCompanySettings(id: number, updates: any) {
    const { data, error } = await supabase
      .from('company_settings')
      .update(updates)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};
