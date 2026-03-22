import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Purchase } from '../../types';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Plus, Search, FileText } from 'lucide-react';
import { PurchaseFormModal } from '../products/PurchaseFormModal';
import { useProductsStore } from '../../store/useProductsStore';
import { formatMoney } from '../../utils/money';

export const PurchasesList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  
  const { products, fetchProducts } = useProductsStore();

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
        
      if (error) {
        console.warn('Error fetching purchases:', error);
      } else {
        setPurchases(data || []);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  const handleNewPurchase = () => {
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseModalClose = useCallback(() => setIsPurchaseModalOpen(false), []);

  const handlePurchaseSuccess = () => {
    fetchPurchases();
    fetchProducts();
  };

  const filteredPurchases = purchases.filter(p => 
    p.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compras e Ingresos</h1>
        <Button onClick={handleNewPurchase} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por proveedor o ID..."
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
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron compras registradas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deuda</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {purchase.supplier_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMoney(purchase.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMoney(purchase.paid_cash || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMoney(purchase.paid_digital || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatMoney(purchase.debt || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isPurchaseModalOpen && (
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          onClose={handlePurchaseModalClose}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};
