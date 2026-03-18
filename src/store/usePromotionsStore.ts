import { create } from 'zustand';
import { Promotion } from '../types';
import { promotionsService } from '../services/promotionsService';

interface PromotionsState {
  promotions: Promotion[];
  isLoading: boolean;
  error: string | null;
  fetchPromotions: () => Promise<void>;
  addPromotion: (promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
}

export const usePromotionsStore = create<PromotionsState>((set) => ({
  promotions: [],
  isLoading: false,
  error: null,
  fetchPromotions: async () => {
    set({ isLoading: true, error: null });
    try {
      const promotions = await promotionsService.getPromotions();
      set({ promotions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  addPromotion: async (promotion) => {
    set({ isLoading: true, error: null });
    try {
      const newPromotion = await promotionsService.addPromotion(promotion);
      set((state) => ({ promotions: [...state.promotions, newPromotion], isLoading: false }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  updatePromotion: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPromotion = await promotionsService.updatePromotion(id, updates);
      set((state) => ({
        promotions: state.promotions.map((p) => (p.id === id ? updatedPromotion : p)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
