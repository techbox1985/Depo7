import { supabase } from './supabaseClient';
import { Promotion } from '../types';

export const promotionsService = {
  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase.from('promotions').select('*');
    if (error) throw error;
    return data || [];
  },

  async addPromotion(promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePromotion(id: string, updates: Partial<Promotion>): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
