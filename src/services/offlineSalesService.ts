import { dbService, STORES, initDB } from './db';

export interface OfflineSale {
  id?: number;
  payload: any;
  timestamp: number;
}

export const offlineSalesService = {
  async addSale(payload: any): Promise<void> {
    const db = await initDB();
    await db.add(STORES.OFFLINE_SALES, { payload, timestamp: Date.now() });
  },
  async getAllSales(): Promise<OfflineSale[]> {
    const db = await initDB();
    return db.getAll(STORES.OFFLINE_SALES);
  },
  async deleteSale(id: number): Promise<void> {
    const db = await initDB();
    await db.delete(STORES.OFFLINE_SALES, id);
  },
};
