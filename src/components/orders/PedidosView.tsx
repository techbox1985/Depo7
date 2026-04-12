import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { OrderDetailsModal } from './OrderDetailsModal';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './OrderPrintUtils';

const formatMoney = (value: number | null | undefined) =>
  `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;

export const PedidosView: React.FC = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false });
    if (error) {
      console.error('Error fetching pedidos:', error);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const stats = useMemo(() => ({
    totalPedidos: pedidos.length,
    totalImporte: pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0),
  }), [pedidos]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Pedidos</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalPedidos}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Importe Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatMoney(stats.totalImporte)}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Código</th>
              <th className="px-6 py-4 text-left font-semibold">Fecha</th>
              <th className="px-6 py-4 text-left font-semibold">Cliente</th>
              <th className="px-6 py-4 text-right font-semibold">Total</th>
              <th className="px-6 py-4 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>Cargando...</td>
              </tr>
            ) : pedidos.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>No hay pedidos</td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr
                  key={pedido.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(pedido)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{pedido.codigo_venta}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(pedido.fecha || pedido.creado_en).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-700">{pedido.customers?.name || 'Consumidor Final'}</td>
                  <td className="px-6 py-4 text-right">{formatMoney(pedido.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:underline mr-2" onClick={e => { e.stopPropagation(); setSelected(pedido); }}>Ver</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <OrderDetailsModal order={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default PedidosView;
