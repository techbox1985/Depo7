import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCashStore } from '../../store/useCashStore';
import { Spinner } from '../ui/Spinner';
import { Printer, Ban, Loader2 } from 'lucide-react';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './Cart';

type SaleRow = {
  id: string;
  caja_id?: string | null;
  codigo_venta?: string | null;
  estado: 'completada' | 'pendiente' | 'presupuesto' | 'anulada' | 'cancelada' | 'cancelled';
  total?: number | null;
  fecha?: string | null;
  creado_en?: string | null;
  customers?: { name?: string | null } | null;
};

const formatCurrency = (value: number | null | undefined) =>
  `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;

const isCancelledSale = (sale: SaleRow) =>
  ['anulada', 'cancelada', 'cancelled'].includes(String(sale.estado || '').toLowerCase());

export const DailySales: React.FC = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);

  const fetchSales = async () => {
    if (!currentSession?.id) {
      setSales([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, caja_id, codigo_venta, estado, total, fecha, creado_en, customers(name)')
        .eq('caja_id', currentSession.id)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('Error fetching POS sales:', error);
        setSales([]);
        return;
      }

      const rows = ((data as SaleRow[]) || []).filter((sale) => !isCancelledSale(sale));
      setSales(rows);
    } catch (error) {
      console.error('Unexpected error fetching POS sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentSession?.id]);

  const groupedSales = useMemo(
    () => ({
      completada: sales.filter((s) => s.estado === 'completada'),
      pendiente: sales.filter((s) => s.estado === 'pendiente'),
      presupuesto: sales.filter((s) => s.estado === 'presupuesto'),
    }),
    [sales]
  );

  const handleReprint = async (sale: SaleRow) => {
    setPrintingSaleId(sale.id);

    try {
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select('product_id, product_name, quantity, price, products(name)')
        .eq('sale_id', sale.id);

      if (error) {
        console.error('Error fetching sale items for print:', error);
        alert(`No se pudo reimprimir el ticket: ${error.message}`);
        return;
      }

      const items: CartSnapshotItem[] = (saleItems || []).map((item: any) => ({
        productId: item.product_id || '',
        productName: item.product_name || item.products?.name || 'Producto',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.price || 0),
        subtotal: Math.round(Number(item.price || 0) * Number(item.quantity || 0)),
      }));

      const ticketData: PostActionData = {
        status: sale.estado,
        items,
        subtotal: items.reduce((acc, item) => acc + item.subtotal, 0),
        total: Math.round(Number(sale.total || 0)),
        createdAt: sale.fecha || sale.creado_en || new Date().toISOString(),
      };

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('El navegador bloqueó la ventana de impresión.');
        return;
      }

      printWindow.document.write(buildPrintHtml(ticketData));
      printWindow.document.close();
    } catch (error) {
      console.error('Error reprinting ticket:', error);
      alert('Ocurrió un error al reimprimir el ticket.');
    } finally {
      setPrintingSaleId(null);
    }
  };

  const handleCancel = async (sale: SaleRow) => {
    if (isCancelledSale(sale)) {
      alert('La venta ya está cancelada.');
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que querés anular ${sale.codigo_venta || 'esta venta'}?`
    );
    if (!confirmed) return;

    setCancellingSaleId(sale.id);

    try {
      console.log('Anulando venta desde POS:', sale.id, sale.codigo_venta);

      const { data, error } = await supabase.rpc('anular_venta', {
        p_sale_id: sale.id,
      });

      console.log('Respuesta anular_venta:', { data, error });

      if (error) {
        console.error('Error calling anular_venta:', error);
        alert(`Error al anular la venta: ${error.message}`);
        return;
      }

      setSales((prev) => prev.filter((item) => item.id !== sale.id));
      await fetchSales();
      alert('Venta anulada correctamente.');
    } catch (error: any) {
      console.error('Unexpected error cancelling sale:', error);
      alert(`Error inesperado al anular: ${error?.message || 'sin detalle'}`);
    } finally {
      setCancellingSaleId(null);
    }
  };

  const renderBlock = (title: string, rows: SaleRow[]) => (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{title}</h3>

      {rows.length === 0 ? (
        <div className="bg-white p-2 rounded border text-xs text-gray-400">
          Sin registros
        </div>
      ) : (
        <div className="space-y-1">
          {rows.map((sale) => (
            <div
              key={sale.id}
              className="flex justify-between items-center bg-white p-2 rounded border text-sm"
            >
              <span className="truncate flex-1">
                {sale.customers?.name || 'Consumidor Final'}
              </span>

              <span className="font-bold w-24 text-right">
                {formatCurrency(sale.total)}
              </span>

              <div className="flex gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => handleReprint(sale)}
                  className="p-1 hover:bg-gray-100 rounded"
                  disabled={printingSaleId === sale.id}
                  title="Reimprimir ticket"
                >
                  {printingSaleId === sale.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Printer size={14} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCancel(sale)}
                  className={`p-1 rounded ${
                    cancellingSaleId === sale.id
                      ? 'text-gray-400'
                      : 'hover:bg-red-100 text-red-500'
                  }`}
                  disabled={cancellingSaleId === sale.id}
                  title="Cancelar venta"
                >
                  {cancellingSaleId === sale.id ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!currentSession?.id) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No hay un turno abierto.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="p-2">
      {renderBlock('Ventas', groupedSales.completada)}
      {renderBlock('Pedidos', groupedSales.pendiente)}
      {renderBlock('Presupuestos', groupedSales.presupuesto)}
    </div>
  );
};