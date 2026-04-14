
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { OrderDetailsModal } from './OrderDetailsModal';
import { Button } from '../ui/Button';
import { useCartStore } from '../../store/useCartStore';
import { SaleActionModal } from '../pventa/SaleActionModal';

const formatMoney = (value: number) => `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;


export const MisPedidosView = () => {
  const { profile } = useCurrentUserProfile();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [pedidoModalOpen, setPedidoModalOpen] = useState(false);
  const { clearCart, items, subtotal, totalDiscount, total } = useCartStore();

  const fetchPedidos = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    let query = supabase
      .from('sales')
      .select('*, customers(name)')
      .eq('sale_kind', 'pedido');
    // Si no es superadmin, filtrar por vendedor
    if (profile.role !== 'superadmin') {
      query = query.eq('seller_user_id', profile.id);
    }
    query = query.order('creado_en', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching pedidos:', error);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // Handler para crear nuevo pedido
  const handleNuevoPedido = () => {
    clearCart();
    setPedidoModalOpen(true);
  };

  // Handler para guardar pedido
  const handleConfirmPedido = async (data: any) => {
    try {
      // Guardar pedido usando salesService
      await import('../../services/salesService').then(m => m.salesService.createSaleSupabase({
        items: data.items,
        total: data.total,
        customerId: data.customerId,
        sale_kind: 'pedido',
        estado: 'pendiente',
        cajaId: null,
      }));
      setPedidoModalOpen(false);
      fetchPedidos();
      clearCart();
    } catch (e) {
      alert('Error al guardar el pedido');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mis pedidos</h1>
        <Button variant="primary" onClick={handleNuevoPedido}>
          Nuevo pedido
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin pedidos</td></tr>
            ) : (
              pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-indigo-50 cursor-pointer">
                  <td className="px-4 py-2 font-semibold text-indigo-900">{pedido.codigo_venta}</td>
                  <td className="px-4 py-2">{pedido.customers?.name || 'Consumidor Final'}</td>
                  <td className="px-4 py-2 text-xs">{new Date(pedido.fecha || pedido.creado_en).toLocaleString()}</td>
                  <td className="px-4 py-2 font-bold">{formatMoney(pedido.total)}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-semibold uppercase text-xs">{pedido.estado.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(pedido)}>
                      Ver detalle
                    </Button>
                    {pedido.estado === 'pendiente' && (
                      <Button size="sm" variant="primary" className="ml-2" onClick={() => setSelected(pedido)}>
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <OrderDetailsModal
        order={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onActionComplete={() => {
          setSelected(null);
          fetchPedidos();
        }}
      />
      <SaleActionModal
        open={pedidoModalOpen}
        mode="pedido"
        onClose={() => setPedidoModalOpen(false)}
        onConfirm={handleConfirmPedido}
        items={items}
        subtotal={subtotal}
        totalDiscount={totalDiscount}
        total={total}
        priceList={"lista_1"}
      />
    </div>
  );
};

export default MisPedidosView;
