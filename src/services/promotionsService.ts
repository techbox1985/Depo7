import { supabase } from './supabaseClient';
import { Promotion } from '../types';

export const promotionsService = {
  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase.from('promotions').select('*');
    if (error) throw error;
    return data || [];
  },

  async addPromotion(promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion> {
    const { products, ...promoData } = promotion;
    const { data, error } = await supabase
      .from('promotions')
      .insert([promoData])
      .select()
      .single();
      
    if (error) throw error;
    
    if (products && products.length > 0) {
      const { error: prodError } = await supabase
        .from('promotion_products')
        .insert(products.map(p => ({ promotion_id: data.id, product_id: p.id })));
      if (prodError) throw prodError;
    }
    
    return { ...data, products };
  },

  async updatePromotion(id: string, updates: Partial<Promotion>): Promise<Promotion> {
    const finalUpdates = { ...updates };
    if (finalUpdates.applies_to === 'global') {
      finalUpdates.target_value = null;
    }

    const { data, error } = await supabase
      .from('promotions')
      .update({ ...finalUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePromotion(id: string): Promise<void> {
    console.log("DELETE PROMO DB", id);
    const { data, error } = await supabase.from('promotions').delete().eq('id', id);
    
    console.log("DELETE PROMO RESPONSE", { data, error });
    
    if (error) {
      throw error;
    }
  },
};