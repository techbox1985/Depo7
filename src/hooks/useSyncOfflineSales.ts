import { useEffect } from 'react';
import { useOfflineSalesStore } from '../store/useOfflineSalesStore';
import { useOnlineStatus } from './useOnlineStatus';
import { salesService } from '../services/salesService';
import { offlineSalesService } from '../services/offlineSalesService';

export const useSyncOfflineSales = () => {
  const isOnline = useOnlineStatus();
  const { pendingSales, removeSale, loadPendingSales } = useOfflineSalesStore();

  // Limpieza agresiva y temprana de ventas pendientes viejas
  const cleanOldPendingSales = async () => {
    let cleaned = false;
    const allSales = await offlineSalesService.getAllSales();
    for (const sale of allSales) {
      const payload = sale.payload || sale;
      const isOldFormat =
        payload.p_total !== undefined ||
        payload.p_cliente_id !== undefined ||
        payload.p_estado !== undefined ||
        payload.p_items !== undefined ||
        !payload.items || !payload.total || !payload.hasOwnProperty('customerId') || !payload.status;
      // También limpiar si falta codigo_venta o si el shape es claramente inválido
      if (isOldFormat || !payload || !payload.items || !Array.isArray(payload.items)) {
        await offlineSalesService.deleteSale(sale.id ?? sale.client_txn_id);
        cleaned = true;
        if (!window.__offlineSyncWarned) {
          console.warn('[OfflineSync] Se eliminaron ventas pendientes incompatibles.');
          window.__offlineSyncWarned = true;
        }
      }
    }
    if (cleaned) await loadPendingSales();
  };

  // Ejecutar limpieza al montar y al reconectar
  useEffect(() => {
    cleanOldPendingSales();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isOnline) cleanOldPendingSales();
    // eslint-disable-next-line
  }, [isOnline]);

  useEffect(() => {
    const syncSales = async () => {
      if (!isOnline || pendingSales.length === 0) return;

      for (const sale of pendingSales) {
        const payload = sale.payload || sale;
        try {
          await salesService.createSaleSupabase(
            payload.items,
            payload.total,
            payload.customerId,
            payload.status || 'completada'
          );
          await removeSale(sale.id ?? sale.client_txn_id);
        } catch (err) {
          // Limpieza agresiva si el error es por codigo_venta o constraint
          const errMsg = String(err?.message || err);
          if (errMsg.includes('codigo_venta') || errMsg.includes('violates not-null constraint') || errMsg.includes('23502')) {
            await removeSale(sale.id ?? sale.client_txn_id);
            if (!window.__offlineSyncWarnedConstraint) {
              console.warn('[OfflineSync] Se eliminaron ventas pendientes por error de constraint/codigo_venta.');
              window.__offlineSyncWarnedConstraint = true;
            }
            continue;
          }
          console.error(`Error syncing sale ${sale.id ?? sale.client_txn_id}:`, err);
        }
      }
    };

    syncSales();
  }, [isOnline, pendingSales, removeSale]);
};
