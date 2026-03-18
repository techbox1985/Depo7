import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Sale, SaleItem } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { CheckCircle } from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onConvertToSale: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onConvertToSale }) => {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de ${order.estado === 'pendiente' ? 'Pedido' : 'Presupuesto'}`} size="lg">
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">ID</p>
              <p className="text-gray-900">{order.codigo_venta}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Fecha</p>
              <p className="text-gray-900">{new Date(order.fecha).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Cliente</p>
              <p className="text-gray-900">{order.customers?.name || 'Consumidor Final'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Total</p>
              <p className="text-gray-900 font-bold">${Number(order.total).toFixed(2)}</p>
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
                        ${item.price.toFixed(2)}
                        {item.price < item.original_price && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Promo)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onConvertToSale} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Convertir a Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
};
