import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { formatMoney } from '../../utils/money';
import { useCashStore } from '../../store/useCashStore';

const SalesPanel = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      if (!currentSession?.id) {
        setSales([]);
        return;
      }
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('caja_id', currentSession.id)
        .order('fecha', { ascending: false });
      if (error) {
        setSales([]);
        return;
      }
      setSales(data || []);
    };
    fetchSales();
  }, [currentSession]);

  return (
    <div className="p-2">
      <h3 className="font-bold mb-2">Ventas del turno</h3>
      {sales.length === 0 ? (
        <div className="text-gray-500">No hay ventas registradas en este turno.</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-1">Código</th>
              <th className="text-left p-1">Fecha</th>
              <th className="text-left p-1">Cliente</th>
              <th className="text-right p-1">Total</th>
              <th className="text-right p-1">Pago</th>
              <th className="text-right p-1">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id}>
                <td className="p-1">{sale.codigo_venta || '-'}</td>
                <td className="p-1">{sale.fecha ? new Date(sale.fecha).toLocaleDateString() + ' ' + new Date(sale.fecha).toLocaleTimeString() : '-'}</td>
                <td className="p-1">{sale.cliente_id || '-'}</td>
                <td className="p-1 text-right">{formatMoney(sale.total || 0)}</td>
                <td className="p-1 text-right">{sale.metodo_pago || '-'}</td>
                <td className="p-1 text-right">{sale.estado || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default SalesPanel;
