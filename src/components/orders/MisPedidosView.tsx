import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { OrderDetailsModal } from './OrderDetailsModal';

const formatMoney = (value) => `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;

const ESTADOS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'en_proceso', label: 'En preparación' },
  { key: 'en_logistica', label: 'En logística' },
  { key: 'entregado', label: 'Entregados' },
];

export const MisPedidosView = () => {
  const { profile } = useCurrentUserProfile();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchPedidos = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .eq('sale_kind', 'pedido')
      .eq('seller_user_id', profile.id)
      .order('creado_en', { ascending: false });
    if (error) {
      console.error('Error fetching pedidos:', error);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const pedidosPorEstado = ESTADOS.reduce((acc, estado) => {
    acc[estado.key] = pedidos.filter(p => p.estado === estado.key);
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis pedidos</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ESTADOS.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-xl shadow p-4 flex flex-col min-h-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-indigo-700">{label}</h2>
              <span className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1 text-xs font-semibold">{pedidosPorEstado[key]?.length || 0}</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {loading ? (
                <div className="text-center text-gray-400 mt-10">Cargando...</div>
              ) : (pedidosPorEstado[key]?.length > 0 ? (
                pedidosPorEstado[key].map((pedido) => (
                  <div
                    key={pedido.id}
                    className="rounded-lg border border-gray-200 shadow-sm p-4 bg-gray-50 hover:bg-indigo-50 transition cursor-pointer"
                    onClick={() => setSelected(pedido)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-indigo-900">{pedido.codigo_venta}</span>
                      <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-semibold uppercase">{pedido.estado.replace('_', ' ')}</span>
                    </div>
                    <div className="text-gray-700 text-sm mb-1">{pedido.customers?.name || 'Consumidor Final'}</div>
                    <div className="text-gray-500 text-xs mb-1">{new Date(pedido.fecha || pedido.creado_en).toLocaleString()}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-gray-900 font-bold">{formatMoney(pedido.total)}</div>
                      <div className="text-xs text-gray-500">{pedido.total_productos || 0} prod.</div>
                    </div>
                    {pedido.metodo_pago && (
                      <div className="mt-1 text-xs text-gray-600">Pago: <span className="font-semibold">{pedido.metodo_pago}</span></div>
                    )}
                    <button
                      className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-1 font-semibold text-xs"
                      onClick={e => { e.stopPropagation(); setSelected(pedido); }}
                    >Ver detalle</button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 mt-10">Sin pedidos</div>
              ))}
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default MisPedidosView;
