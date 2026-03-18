import { create } from 'zustand';
import { Product } from '../types';
import { productsService } from '../services/productsService';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchMoreProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
}

const LIMIT = 50;

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null, hasMore: true });
    try {
      const products = await productsService.getProductsPaginated(0, LIMIT);
      set({ products, isLoading: false, hasMore: products.length === LIMIT });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  fetchMoreProducts: async () => {
    const { products, isLoadingMore, hasMore } = get();
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true, error: null });
    try {
      const newProducts = await productsService.getProductsPaginated(products.length, LIMIT);
      set({ 
        products: [...products, ...newProducts], 
        isLoadingMore: false,
        hasMore: newProducts.length === LIMIT
      });
    } catch (error: any) {
      set({ error: error.message, isLoadingMore: false });
    }
  },
  addProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await productsService.addProduct(product);
      set((state) => ({ products: [newProduct, ...state.products], isLoading: false }));
      return newProduct;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productsService.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
        isLoading: false,
      }));
      return updatedProduct;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
