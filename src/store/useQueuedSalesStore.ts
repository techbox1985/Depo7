import { create } from 'zustand';
import { CartItem, Customer, PriceList } from '../types';

export interface QueuedSale {
  id: string;
  label: string;
  items: CartItem[];
  customer?: Customer | null;
  priceList?: PriceList | null;
  discount?: number;
  operationType?: string;
  total: number;
}

interface QueuedSalesState {
  queuedSales: QueuedSale[];
  addSale: (sale: Omit<QueuedSale, 'id' | 'label'>) => void;
  removeSale: (id: string) => void;
  getSale: (id: string) => QueuedSale | undefined;
}

let saleCounter = 1;

export const useQueuedSalesStore = create<QueuedSalesState>((set, get) => ({
  queuedSales: [],
  addSale: (sale) => set((state) => {
    const id = `${Date.now()}-${saleCounter++}`;
    const label = `Venta en cola ${state.queuedSales.length + 1}`;
    return {
      queuedSales: [
        ...state.queuedSales,
        { ...sale, id, label },
      ],
    };
  }),
  removeSale: (id) => set((state) => ({
    queuedSales: state.queuedSales.filter((s) => s.id !== id),
  })),
  getSale: (id) => get().queuedSales.find((s) => s.id === id),
}));
