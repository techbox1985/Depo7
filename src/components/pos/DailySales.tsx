import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCashStore } from '../../store/useCashStore';
import { Spinner } from '../ui/Spinner';
import { Printer } from 'lucide-react';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './Cart';

type SaleRow = {
  id: string;
  codigo_venta?: string;
  estado: 'completada' | 'pendiente' | 'presupuesto';
  total?: number;
  fecha?: string;
  creado_en?: string;
  customers?: {
    name?: string | null;
  } | null;
};

const formatCurrency = (value: number | null | undefined) => {
  return `$${Math.round(Number(value || 0))}`;
};

export const DailySales: React.FC = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          codigo_venta,
          estado,
          total,
          fecha,
          creado_en,
          customers(name)
        `)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error loading sales history:', error);
        setSales([]);
      } else {
        setSales((data as SaleRow[]) || []);
      }

      setLoading(false);
    };

    fetchSales();
  }, [currentSession]);

  const groupedSales = useMemo(() => {
    return {
      completada: sales.filter((s) => s.estado === 'completada'),
      pendiente: sales.filter((s) => s.estado === 'pendiente'),
      presupuesto: sales.filter((s) => s.estado === 'presupuesto'),
    };
  }, [sales]);

  const handleReprint = async (sale: SaleRow) => {
    try {
      setPrintingSaleId(sale.id);

      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select(`
          product_id,
          product_name,
          quantity,
          price,
          products(name)
        `)
        .eq('sale_id', sale.id)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error loading sale items:', error);
        return;
      }

      const items: CartSnapshotItem[] = (saleItems || []).map((item: any) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.price || 0);

        return {
          productId: item.product_id || '',
          productName: item.product_name || item.products?.name || 'Producto',
          quantity,
          unitPrice,
          subtotal: Math.round(unitPrice * quantity),
        };
      });

      const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);

      const ticketData: PostActionData = {
        status: sale.estado,
        items,
        subtotal,
        total: Math.round(Number(sale.total || subtotal)),
        createdAt: sale.fecha || sale.creado_en || new Date().toISOString(),
      };

      const printWindow = window.open('', '_blank');

      if (!printWindow) return;

      printWindow.document.write(buildPrintHtml(ticketData));
      printWindow.document.close();
    } catch (err) {
      console.error('Error reprinting:', err);
    } finally {
      setPrintingSaleId(null);
    }
  };

  const renderList = (rows: SaleRow[]) => {
    if (rows.length === 0) return null;

    return (
      <div className="flex flex-col gap-2">
        {rows.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
          >
            {/* REIMPRIMIR */}
            <button
              onClick={() => handleReprint(sale)}
              disabled={printingSaleId === sale.id}
              className="text-gray-500 hover:text-black"
            >
              {printingSaleId === sale.id ? (
                <Spinner size="sm" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
            </button>

            {/* CLIENTE */}
            <div className="flex-1 px-2 truncate text-sm">
              {sale.customers?.name || 'Consumidor Final'}
            </div>

            {/* TOTAL */}
            <div className="font-semibold text-sm">
              {formatCurrency(sale.total)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-4">
      {renderList(groupedSales.completada)}
      {renderList(groupedSales.pendiente)}
      {renderList(groupedSales.presupuesto)}
    </div>
  );
};