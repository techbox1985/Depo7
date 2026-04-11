import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/Button';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './OrderPrintUtils';

type Sale = {
  id: string;
  codigo_venta?: string;
  estado: string;
  fecha?: string;
  creado_en?: string;
  total?: number;
  customers?: { name?: string | null } | null;
};

type SaleItem = {
  id: string;
  sale_id: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  price?: number;
  original_price?: number;
};

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Sale;
  onActionComplete?: () => Promise<void> | void;
}

const formatMoney = (value: number | null | undefined) =>
  `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;

const isCancelled = (estado?: string | null) => {
  if (!estado) return false;
  const e = estado.toLowerCase().trim();
  return e === 'anulada' || e === 'cancelada' || e === 'cancelled';
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onActionComplete,
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchItems();
    }
  }, [isOpen, order?.id]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', order.id);

      if (error) {
        console.error('Error fetching order items:', error);
        setItems([]);
      } else {
        setItems((data as SaleItem[]) || []);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (isCancelled(order.estado)) {
      alert('La venta ya está cancelada');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas anular el movimiento ${order.codigo_venta || order.id}?`
    );
    if (!confirmed) return;

    setActionLoading(true);

    try {
      const { error } = await supabase.rpc('anular_venta', {
        p_sale_id: order.id,
      });

      if (error) throw error;

      alert('Movimiento anulado correctamente');

      if (onActionComplete) {
        await onActionComplete();
      } else {
        onClose();
      }
    } catch (e: any) {
      console.error('Error cancelar venta', e);
      alert(`Error al cancelar el movimiento: ${e?.message || 'sin detalle'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprint = async () => {
    try {
      const cartItems: CartSnapshotItem[] = items.map((item) => ({
        productId: item.product_id || '',
        productName: item.product_name || 'Producto',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.price || 0),
        subtotal: Math.round(Number(item.quantity || 0) * Number(item.price || 0)),
      }));

      const ticketData: PostActionData = {
        status: order.estado,
        items: cartItems,
        subtotal: cartItems.reduce((acc, item) => acc + item.subtotal, 0),
        total: Number(order.total || 0),
        createdAt: order.fecha || order.creado_en || new Date().toISOString(),
      };

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('El navegador bloqueó la ventana de impresión.');
        return;
      }

      printWindow.document.write(buildPrintHtml(ticketData));
      printWindow.document.close();
    } catch (e) {
      console.error('Error al reimprimir:', e);
      alert('Error al reimprimir el ticket.');
    }
  };

  const handleEdit = () => {
    console.log('EDITAR → POS (MODAL)', order.id);
    localStorage.setItem('pos_edit_sale_id', order.id);
    onClose();
    navigate('/pos');
  };

  const handleConvertToSale = async () => {
    alert('Convertir a venta solo debe implementarse para presupuestos');
  };

  const getTitle = () => {
    if (isCancelled(order.estado)) return 'Detalles de Movimiento Cancelado';
    if (order.estado === 'presupuesto') return 'Detalles de Presupuesto';
    if (order.estado === 'pendiente') return 'Detalles del Pedido';
    if (order.estado === 'completada') return 'Detalles de la Venta';
    return 'Detalles del Movimiento';
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
              <p className="text-gray-900">
                {new Date(order.fecha || order.creado_en || new Date().toISOString()).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Cliente</p>
              <p className="text-gray-900">{order.customers?.name || 'Consumidor Final'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Total</p>
              <p className="text-gray-900 font-bold">{formatMoney(order.total)}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productos</h3>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando productos...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay productos en este registro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
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
                        {formatMoney(Number(item.quantity || 0) * Number(item.price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          <Button type="button" variant="secondary" onClick={handleReprint}>
            Reimprimir
          </Button>

          <Button type="button" variant="secondary" onClick={handleEdit}>
            Editar
          </Button>

          {!isCancelled(order.estado) && (
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={actionLoading}>
              Anular
            </Button>
          )}

          {order.estado === 'presupuesto' && (
            <Button type="button" onClick={handleConvertToSale}>
              Convertir a Venta
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};