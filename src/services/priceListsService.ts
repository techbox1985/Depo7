import { supabase } from './supabaseClient';
import { PriceList, ProductPrice } from '../types';

type RecalculatePriceListResult = {
  price_list_code: string;
  margin_percent: number;
  updated_products: number;
};

export const priceListsService = {
  async getPriceLists(): Promise<PriceList[]> {
    const { data, error } = await supabase
      .from('price_lists')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createPriceList(payload: {
    name: string;
    code: string;
    margin_percent: number;
    active: boolean;
    sort_order: number;
  }): Promise<PriceList> {
    const { data, error } = await supabase
      .from('price_lists')
      .insert({
        name: payload.name,
        code: payload.code,
        margin_percent: payload.margin_percent,
        active: payload.active,
        sort_order: payload.sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePriceListMargin(id: string, marginPercent: number): Promise<PriceList> {
    const { data, error } = await supabase
      .from('price_lists')
      .update({
        margin_percent: marginPercent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async recalculatePriceList(
    code: string,
    newMarginPercent?: number
  ): Promise<RecalculatePriceListResult> {
    const { data, error } = await supabase.rpc('recalculate_price_list', {
      p_price_list_code: code,
      p_new_margin_percent: typeof newMarginPercent === 'number' ? newMarginPercent : null,
    });

    if (error) throw error;
    return data as RecalculatePriceListResult;
  },

  async getProductPrices(productId: string): Promise<ProductPrice[]> {
    const { data, error } = await supabase
      .from('product_prices')
      .select('*, price_list:price_lists(*)')
      .eq('product_id', productId);

    if (error) throw error;
    return data || [];
  },

  async updateProductPrice(id: string, updates: Partial<ProductPrice>): Promise<ProductPrice> {
    const {
      price_list,
      price_lists,
      ...safeUpdates
    } = updates as Partial<ProductPrice> & {
      price_list?: unknown;
      price_lists?: unknown;
    };

    const { data, error } = await supabase
      .from('product_prices')
      .update({
        ...safeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertProductPrice(productPrice: Partial<ProductPrice>): Promise<ProductPrice> {
    const {
      price_list,
      price_lists,
      ...safeProductPrice
    } = productPrice as Partial<ProductPrice> & {
      price_list?: unknown;
      price_lists?: unknown;
    };

    const { data, error } = await supabase
      .from('product_prices')
      .upsert(
        {
          ...safeProductPrice,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id,price_list_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};