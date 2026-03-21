import { create } from 'zustand';
import { offlineSalesService, OfflineSale } from '../services/offlineSalesService';

interface OfflineSalesState {
  pendingSales: OfflineSale[];
  loadPendingSales: () => Promise<void>;
  addSale: (payload: any) => Promise<void>;
  removeSale: (id: number) => Promise<void>;
}

export const useOfflineSalesStore = create<OfflineSalesState>((set, get) => ({
  pendingSales: [],
  loadPendingSales: async () => {
    const sales = await offlineSalesService.getAllSales();
    set({ pendingSales: sales });
  },
  addSale: async (payload: any) => {
    await offlineSalesService.addSale(payload);
    await get().loadPendingSales();
  },
  removeSale: async (id: number) => {
    await offlineSalesService.deleteSale(id);
    await get().loadPendingSales();
  },
}));
