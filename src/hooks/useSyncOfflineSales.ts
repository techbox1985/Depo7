import { useEffect } from 'react';
import { useOfflineSalesStore } from '../store/useOfflineSalesStore';
import { useOnlineStatus } from './useOnlineStatus';
import { supabase } from '../services/supabaseClient';

export const useSyncOfflineSales = () => {
  const isOnline = useOnlineStatus();
  const { pendingSales, removeSale, loadPendingSales } = useOfflineSalesStore();

  useEffect(() => {
    loadPendingSales();
  }, [loadPendingSales]);

  useEffect(() => {
    const syncSales = async () => {
      if (!isOnline || pendingSales.length === 0) return;

      for (const sale of pendingSales) {
        try {
          const rpcName = sale.payload.p_sale_id ? 'update_sale_with_items' : 'create_sale_with_status';
          const { error } = await supabase.rpc(rpcName, sale.payload);
          if (!error) {
            await removeSale(sale.id!);
          } else {
            console.error(`Error syncing sale ${sale.id}:`, error);
          }
        } catch (err) {
          console.error('Failed to sync sale:', err);
        }
      }
    };

    syncSales();
  }, [isOnline, pendingSales, removeSale]);
};
