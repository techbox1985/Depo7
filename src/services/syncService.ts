import { offlineDb } from './offlineDb';
import { salesService } from './salesService';

export const syncService = {
  async syncPendingSales() {
    if (!navigator.onLine) return;

    const pendingSales = await offlineDb.getPendingSales();
    for (const sale of pendingSales) {
      try {
        await salesService.createSaleSupabase(sale.items, sale.total, sale.customerId, sale.status);
        await offlineDb.deleteSale(sale.client_txn_id);
      } catch (e) {
        console.error('Failed to sync sale:', e);
      }
    }
  }
};
