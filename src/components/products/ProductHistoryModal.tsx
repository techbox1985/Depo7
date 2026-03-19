import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Product } from '../../types';
import { productsService } from '../../services/productsService';
import { Spinner } from '../ui/Spinner';
import { useProductsStore } from '../../store/useProductsStore';
import { formatMoney } from '../../utils/money';

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = React.memo(({ isOpen, onClose, product }) => {
  const [activeTab, setActiveTab] = useState<'ventas' | 'compras'>('ventas');
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchProducts } = useProductsStore();

  const fetchHistory = useCallback(async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const [sales, purchases] = await Promise.all([
        productsService.getProductSalesHistory(product.id),
        productsService.getProductPurchasesHistory(product.id)
      ]);
      setSalesHistory(sales);
      setPurchasesHistory(purchases);
    } catch (error) {
      console.error('Error fetching product history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handlePurchaseSuccess = () => {
    fetchHistory();
    fetchProducts(); // Refresh products to update stock and stats
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historial: ${product?.name}`}>
      <div className="space-y-4">
          <div className="border-b border-gray-200 flex justify-between items-center">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('ventas')}
                className={`${
                  activeTab === 'ventas'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Ventas
              </button>
              <button
                onClick={() => setActiveTab('compras')}
                className={`${
                  activeTab === 'compras'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Compras / Ingresos
              </button>
            </nav>
          </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : activeTab === 'ventas' ? (
          salesHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay ventas registradas para este producto.</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesHistory.map((item) => {
                    const date = item.sales?.date ? new Date(item.sales.date) : new Date(item.created_at);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.sales?.customer_name || 'Consumidor Final'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatMoney(item.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatMoney(item.quantity * item.price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          purchasesHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay compras registradas para este producto.</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchasesHistory.map((item) => {
                    const date = item.purchases?.date ? new Date(item.purchases.date) : new Date(item.created_at);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {date.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.purchases?.supplier_name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatMoney(item.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatMoney(item.quantity * item.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(item.purchases?.paid_cash || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(item.purchases?.paid_digital || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatMoney(item.purchases?.debt || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Modal>
  );
});
