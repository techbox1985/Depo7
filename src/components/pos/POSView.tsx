import React, { useEffect, useState } from 'react';
import { ProductGrid } from '../products/ProductGrid';
import { POSSidebar } from './POSSidebar';
import { useCashStore } from '../../store/useCashStore';
import { useCartStore } from '../../store/useCartStore';
import { CashModal } from './CashModal';
import { Spinner } from '../ui/Spinner';
import { supabase } from '../../services/supabaseClient';

export const POSView: React.FC = () => {
  const { currentSession, isLoading, fetchCurrentSession } = useCashStore();
  const { loadCartFromSale, clearCart, setEditingSaleId, editingSaleId } = useCartStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  useEffect(() => {
    fetchCurrentSession();
  }, [fetchCurrentSession]);

  useEffect(() => {
    if (!isLoading && !currentSession) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [isLoading, currentSession]);

  useEffect(() => {
    const editId = localStorage.getItem('pos_edit_sale_id');
    if (!editId) return;

    const loadSale = async () => {
      setIsEditLoading(true);
      try {
        const { data: sale, error: saleError } = await supabase.from('sales').select('price_list').eq('id', editId).single();
        if (saleError) throw saleError;
        const { data: items, error: itemsError } = await supabase.from('sale_items').select('*').eq('sale_id', editId);
        if (itemsError) throw itemsError;

        clearCart();
        loadCartFromSale(items || [], sale.price_list);
        setEditingSaleId(editId, sale.price_list, items || []);
        localStorage.removeItem('pos_edit_sale_id');
      } catch (err) {
        console.error('Error en edición:', err);
        alert('Ocurrió un error al cargar la venta para edición.');
      } finally {
        setIsEditLoading(false);
      }
    };
    loadSale();
  }, [loadCartFromSale, clearCart, setEditingSaleId]);

  if (isLoading || isEditLoading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row overflow-hidden">
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${!currentSession ? 'opacity-50 blur-sm pointer-events-none' : ''} transition-all duration-300`}>
        {editingSaleId && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Editando movimiento: <span className="font-semibold">{editingSaleId}</span>
          </div>
        )}
        <ProductGrid />
      </div>
      <div className="w-full lg:w-96 border-l border-gray-200 bg-white flex-shrink-0 h-[50vh] lg:h-full flex flex-col transition-all duration-300">
        <POSSidebar />
      </div>
      {!currentSession && isModalOpen && <CashModal isOpen={isModalOpen} onClose={() => {}} type="open" mandatory={true} />}
    </div>
  );
};