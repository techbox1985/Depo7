import { supabase } from './supabaseClient';
import { Product } from '../types';
import { offlineDb } from './offlineDb';

export const productsService = {
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*, product_prices(*, price_lists(*))');
      if (error) throw error;
      if (data) await offlineDb.saveProducts(data);
      return data || [];
    } catch (error) {
      console.warn('Supabase fetch failed, falling back to offline cache', error);
      return await offlineDb.getProducts();
    }
  },

  async getProductsPaginated(offset: number, limit: number): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_prices(*, price_lists(*))')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    return data || [];
  },

  async getProductsStats(): Promise<{ total: number; activos: number; inactivos: number; con_stock: number; sin_stock: number }> {
    const { data, error } = await supabase.rpc('get_products_stats');
    
    if (error) {
      console.warn('RPC get_products_stats failed, returning default stats', error);
      return { total: 0, activos: 0, inactivos: 0, con_stock: 0, sin_stock: 0 };
    }
    
    return data || { total: 0, activos: 0, inactivos: 0, con_stock: 0, sin_stock: 0 };
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getProductSalesHistory(product_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('sale_items')
      .select('*, sales(date, customer_name)')
      .eq('product_id', product_id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.warn('Error fetching sales history:', error);
      return [];
    }
    return data || [];
  },

  async getProductPurchasesHistory(product_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('purchase_items')
      .select('*, purchases(date, supplier_name, paid_cash, paid_digital, debt)')
      .eq('product_id', product_id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.warn('Error fetching purchase history, table might not exist yet:', error);
      return []; // Return empty array if table doesn't exist to prevent breaking the UI
    }
    return data || [];
  },

  async addPurchase(
    purchaseData: {
      supplier_id: string | null;
      supplier_name: string;
      date: string;
      paid_cash: number;
      paid_digital: number;
      items: {
        product_id: string;
        product_name: string;
        quantity: number;
        price: number;
        expiration_date: string | null;
      }[];
    }
  ): Promise<void> {
    const payload = {
      p_supplier_id: purchaseData.supplier_id,
      p_purchase_date: purchaseData.date,
      p_paid_cash: purchaseData.paid_cash,
      p_paid_digital: purchaseData.paid_digital,
      p_items: purchaseData.items
    };

    const { error } = await supabase.rpc('add_purchase_with_items', payload);

    if (error) {
      console.warn('RPC add_purchase_with_items failed, falling back to manual inserts', error);
      
      // Fallback if RPC doesn't exist yet
      const total = purchaseData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      const debt = total - purchaseData.paid_cash - purchaseData.paid_digital;
      
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          supplier_id: purchaseData.supplier_id,
          supplier_name: purchaseData.supplier_name,
          total: total,
          paid_cash: purchaseData.paid_cash,
          paid_digital: purchaseData.paid_digital,
          debt: debt > 0 ? debt : 0,
          date: purchaseData.date
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      for (const item of purchaseData.items) {
        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert([{
            purchase_id: purchase.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            expiration_date: item.expiration_date || null
          }]);

        if (itemError) throw itemError;

        // Update the product stock
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (product) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              stock: product.stock + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);

          if (updateError) throw updateError;
        }
      }
    }
  },
};

