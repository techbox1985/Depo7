import { create } from 'zustand';
import { Product } from '../types';
import { productsService } from '../services/productsService';
import { dbService, STORES } from '../services/db';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchProducts: (isPOS?: boolean) => Promise<void>;
  fetchMoreProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
}



export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  fetchProducts: async (isPOS = false) => {
    set({ isLoading: true, error: null, hasMore: true });
    try {
      let products: Product[];
      if (isPOS) {
        products = await productsService.getAllProductsForPOS();
        set({ products, isLoading: false, hasMore: false });
      } else {
        // Eliminar paginación por defecto, traer todos los productos
        products = await productsService.getAllProductsForPOS();
        await dbService.setAll(STORES.PRODUCTS, products);
        set({ products, isLoading: false, hasMore: false });
      }
    } catch (error: any) {
      const cachedProducts = await dbService.getAll<Product>(STORES.PRODUCTS);
      if (cachedProducts.length > 0) {
        set({ products: cachedProducts, isLoading: false, hasMore: false });
      } else {
        set({ error: error.message, isLoading: false });
      }
    }
  },
  fetchMoreProducts: async () => {
    const { products, isLoadingMore, hasMore } = get();
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true, error: null });
    try {
      // fetchMoreProducts ya no es necesario, pero lo dejamos vacío para compatibilidad
      set({ isLoadingMore: false, hasMore: false });
    } catch (error: any) {
      set({ error: error.message, isLoadingMore: false });
    }
  },
  addProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await productsService.addProduct(product);
      const updatedProducts = [newProduct, ...get().products];
      await dbService.setAll(STORES.PRODUCTS, updatedProducts);
      set({ products: updatedProducts, isLoading: false });
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
      const updatedProducts = get().products.map((p) => (p.id === id ? updatedProduct : p));
      await dbService.setAll(STORES.PRODUCTS, updatedProducts);
      set({
        products: updatedProducts,
        isLoading: false,
      });
      return updatedProduct;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
