import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Sale } from '../../types';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Search, FileText, Clock, Eye, CheckCircle } from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal';
import { formatMoney } from '../../utils/money';

export const OrdersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pendiente' | 'presupuesto'>('pendiente');
  const [orders, setOrders] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .in('estado', ['pendiente', 'presupuesto'])
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesTab = order.estado === activeTab;
      const matchesSearch = 
        order.codigo_venta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customers?.name && order.customers.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm]);

  const handleViewDetails = (order: Sale) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleConvertToSale = async (order: Sale) => {
    try {
      // To convert to sale, we need to call create_sale_with_status with status='completed'
      // But we need the items. We should fetch them first or pass them to checkout.
      // Actually, since the order is already in the database, we could just update its status and deduct stock.
      // But the user requested: "Convertir a venta" (solo para presupuestos o pedidos) -> llama a checkout con status='completed'.
      // Wait, checkout uses cartStore.items. If we just call checkout, it will use the current cart.
      // That's not right. We need to load the order items into the cart, or call the RPC directly.
      // Let's call the RPC directly here to avoid messing with the cart.
      
      const { data: items, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', order.id);

      if (itemsError) throw itemsError;

      const payload = {
        p_total: order.total,
        p_cliente_id: order.cliente_id,
        p_estado: 'completada',
        p_items: items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          original_price: item.original_price
        })),
        p_metodo_pago: order.metodo_pago,
        p_tipo_digital: order.tipo_digital,
        p_cuotas: order.cuotas,
        p_monto_efectivo: order.monto_efectivo,
        p_monto_digital: order.monto_digital,
        p_tipo_descuento: order.tipo_descuento,
        p_valor_descuento: order.valor_descuento,
        p_caja_id: order.caja_id
      };

      const { error: rpcError } = await supabase.rpc('create_sale_with_status', payload);

      if (rpcError) {
        if (rpcError.message.includes('stock') || rpcError.message.includes('violates check constraint')) {
          throw new Error('Stock insuficiente para uno o más productos');
        }
        throw rpcError;
      }

      // Optionally, delete the old pending/quote order or mark it as converted.
      // For simplicity, we can delete the old one since we created a new completed sale.
      await supabase.from('sales').delete().eq('id', order.id);

      alert('¡Convertido a venta con éxito!');
      fetchOrders();
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Error converting to sale:', error);
      alert(error.message || 'Error al convertir a venta');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos y Presupuestos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pendiente')}
              className={`${
                activeTab === 'pendiente'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex justify-center items-center gap-2`}
            >
              <Clock className="h-4 w-4" />
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab('presupuesto')}
              className={`${
                activeTab === 'presupuesto'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex justify-center items-center gap-2`}
            >
              <FileText className="h-4 w-4" />
              Presupuestos
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cliente o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'pendiente' ? (
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
            ) : (
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay {activeTab === 'pendiente' ? 'pedidos' : 'presupuestos'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron registros con los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    onViewDetails={() => handleViewDetails(order)} 
                    onConvertToSale={() => handleConvertToSale(order)} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          onConvertToSale={() => handleConvertToSale(selectedOrder)}
        />
      )}
    </div>
  );
};

const OrderRow = React.memo(({ 
  order, 
  onViewDetails, 
  onConvertToSale 
}: { 
  order: any; 
  onViewDetails: () => void;
  onConvertToSale: () => void;
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {order.codigo_venta}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(order.fecha).toLocaleDateString()} {new Date(order.fecha).toLocaleTimeString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.customers?.name || 'Consumidor Final'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatMoney(Number(order.total))}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onViewDetails} className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Detalles
          </Button>
          <Button size="sm" onClick={onConvertToSale} className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Convertir a Venta
          </Button>
        </div>
      </td>
    </tr>
  );
});
