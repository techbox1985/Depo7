import { create } from 'zustand';
import { cashService, CashClosing } from '../services/cashService';

interface CashState {
  currentSession: CashClosing | null;
  isLoading: boolean;
  fetchCurrentSession: () => Promise<void>;
  openSession: (amount: number, userId?: string) => Promise<void>;
  closeSession: (closeAmount: number, summary: any) => Promise<void>;
}

export const useCashStore = create<CashState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  
  fetchCurrentSession: async () => {
    set({ isLoading: true });
    try {
      const session = await cashService.getCurrentSession();
      set({ currentSession: session });
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  openSession: async (amount: number, userId?: string) => {
    const session = await cashService.openSession(amount, userId);
    set({ currentSession: session });
  },
  
  closeSession: async (closeAmount: number, summary: any) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    await cashService.closeSession(currentSession.id, closeAmount, summary);
    set({ currentSession: null });
  }
}));
