import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { SaleItem } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { CheckCircle, Ban, Printer, Edit } from 'lucide-react';
import { formatMoney } from '../../utils/money';
import { buildPrintHtml, PostActionData } from '../pos/Cart';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onActionComplete: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onActionComplete }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, order.id]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', order.id);

      if (error) {
        console.error('Error fetching order items:', error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCancelled = ['anulada', 'cancelada', 'cancelled'].includes(order.estado.toLowerCase());

  const handleCancel = async () => {
    if (isCancelled) return;
    if (!window.confirm(`¿Estás seguro de que deseas anular este movimiento (${order.codigo_venta || order.id})?`)) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('anular_venta', { p_sale_id: order.id });
      if (error) throw error;
      onActionComplete();
      onClose();
    } catch (e) {
      console.error('Error al cancelar:', e);
      alert('Error al cancelar el movimiento.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (order.estado !== 'presupuesto') return;
    if (!window.confirm('¿Confirmar conversión a venta?')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('convertir_presupuesto_a_venta', { p_sale_id: order.id });
      if (error) throw error;
      onActionComplete();
      onClose();
    } catch (e) {
      console.error('Error al convertir:', e);
      alert('Error al convertir a venta.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprint = () => {
    const printData: PostActionData = {
      status: order.estado === 'completada' ? 'completada' : order.estado === 'presupuesto' ? 'presupuesto' : 'pendiente',
      items: items.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
      total: order.total,
      createdAt: order.creado_en,
    };

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(printData));
    printWindow.document.close();
  };

  const handleEdit = () => {
    alert(`La edición del movimiento ${order.codigo_venta || order.id} no está implementada.`);
  };

  const getTitle = () => {
    switch (order.estado) {
      case 'pendiente': return 'Detalles del Pedido';
      case 'presupuesto': return 'Detalles del Presupuesto';
      case 'completada': return 'Detalles de la Venta';
      case 'cancelada':
      case 'anulada':
      case 'cancelled': return 'Detalles de Movimiento Cancelado';
      default: return 'Detalles del Movimiento';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="lg">
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">ID</p>
              <p className="text-gray-900">{order.codigo_venta || order.id}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Fecha</p>
              <p className="text-gray-900">{new Date(order.creado_en).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Cliente</p>
              <p className="text-gray-900">{order.customers?.name || 'Consumidor Final'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Total</p>
              <p className="text-gray-900 font-bold">{formatMoney(Number(order.total))}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay productos en este registro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatMoney(item.price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMoney(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={actionLoading}>
            Cerrar
          </Button>
          
          <Button onClick={handleReprint} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700" disabled={actionLoading}>
            <Printer className="h-4 w-4" />
            Reimprimir
          </Button>

          <Button onClick={handleEdit} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" disabled={actionLoading}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>

          {!isCancelled && (
            <>
              {order.estado === 'presupuesto' && (
                <Button onClick={handleConvertToSale} className="flex items-center gap-2 bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4" />
                  Convertir a Venta
                </Button>
              )}
              
              <Button onClick={handleCancel} className="flex items-center gap-2 bg-red-600 hover:bg-red-700" disabled={actionLoading}>
                <Ban className="h-4 w-4" />
                Anular
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
