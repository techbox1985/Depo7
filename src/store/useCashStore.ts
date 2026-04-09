import { create } from 'zustand';
import { cashService, CashClosing } from '../services/cashService';
import { dbService, STORES } from '../services/db';

interface CashState {
  currentSession: CashClosing | null;
  isLoading: boolean;
  fetchCurrentSession: (userId?: string) => Promise<void>;
  openSession: (amount: number, userId?: string) => Promise<void>;
  closeSession: (closeAmount: number, summary: any) => Promise<void>;
}

const SESSION_CACHE_KEY = 'current_cash_session';

export const useCashStore = create<CashState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  
  fetchCurrentSession: async (userId?: string) => {
    set({ isLoading: true });
    try {
      const session = await cashService.getCurrentSession(userId);
      if (session) {
        await dbService.set(STORES.CONFIG, SESSION_CACHE_KEY, session);
      } else {
        await dbService.set(STORES.CONFIG, SESSION_CACHE_KEY, null);
      }
      set({ currentSession: session });
    } catch (error) {
      console.error('Error fetching session:', error);
      const cachedSession = await dbService.get<{ value: CashClosing }>(STORES.CONFIG, SESSION_CACHE_KEY);
      if (cachedSession?.value) {
        set({ currentSession: cachedSession.value });
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  openSession: async (amount: number, userId?: string) => {
    const session = await cashService.openSession(amount, userId);
    await dbService.set(STORES.CONFIG, SESSION_CACHE_KEY, session);
    set({ currentSession: session });
  },
  
  closeSession: async (closeAmount: number, summary: any) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    await cashService.closeSession(currentSession.id, closeAmount, summary);
    await dbService.set(STORES.CONFIG, SESSION_CACHE_KEY, null);
    set({ currentSession: null });
  }
}));
