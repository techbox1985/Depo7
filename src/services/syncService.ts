import { offlineDb } from './offlineDb';
import { salesService } from './salesService';

export const syncService = {
  async syncPendingSales() {
    if (!navigator.onLine) return;

    const pendingSales = await offlineDb.getPendingSales();
    for (const sale of pendingSales) {
      try {
        await salesService.createSaleSupabase({
          items: sale.items,
          total: sale.total,
          customerId: sale.customerId,
          sale_kind: sale.sale_kind || 'venta',
          estado: sale.status || sale.estado || 'completada',
          cajaId: sale.cajaId || sale.caja_id || null
        });
        await offlineDb.deleteSale(sale.client_txn_id);
      } catch (e) {
        console.error('Failed to sync sale:', e);
      }
    }
  }
};
