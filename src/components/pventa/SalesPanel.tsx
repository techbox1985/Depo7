import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { formatMoney } from '../../utils/money';
import { useCashStore } from '../../store/useCashStore';
import { Ticket55mm } from './Ticket55mm';
import { useNavigate } from 'react-router-dom';


const SalesPanel = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<any[]>([]);
  const [printingSale, setPrintingSale] = useState<any | null>(null);
  const [printingItems, setPrintingItems] = useState<any[]>([]);
  const ticketRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      if (!currentSession?.id) {
        setSales([]);
        return;
      }
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('caja_id', currentSession.id)
        .order('fecha', { ascending: false });
      if (error) {
        setSales([]);
        return;
      }
      setSales(data || []);
    };
    fetchSales();
  }, [currentSession]);

  // Print logic
  useEffect(() => {
    if (printingSale && printingItems.length > 0) {
      setTimeout(() => {
        if (!ticketRef.current) return;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;
        printWindow.document.write('<html><head><title>Ticket</title>');
        printWindow.document.write('<style>body{margin:0;padding:0;}@media print{body{margin:0;}}</style>');
    // Print logic with logo load check
        printWindow.document.write(ticketRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setPrintingSale(null);
          setPrintingItems([]);
        }, 300);
      }, 100);
    }
  }, [printingSale, printingItems]);

  const handleReprint = async (sale: any) => {
    // Fetch sale items
    const { data: items, error } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id);
    if (error || !items) {
      alert('No se pudieron obtener los ítems de la venta');
      return;
    }
    setPrintingSale(sale);
    setPrintingItems(items);
  };

  // Editar: navegar a edición si existe ruta
  const handleEdit = (sale: any) => {
    // Suponiendo que existe ruta /pventa/editar/:id
    navigate(`/pventa/editar/${sale.id}`);
  };

  // Cancelar venta: update estado a 'cancelada'
  const handleCancel = async (sale: any) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta venta?')) return;
    setCancellingId(sale.id);
    const { error } = await supabase
      .from('sales')
      .update({ estado: 'cancelada' })
      .eq('id', sale.id);
    setCancellingId(null);
    if (error) {
      alert('No se pudo cancelar la venta');
      return;
    }
    setSales(sales => sales.map(s => s.id === sale.id ? { ...s, estado: 'cancelada' } : s));
  };

  // Dummy config for ticket header (replace with real data if available)
  const companyName = 'Distribuidora';
  const companyAddress = 'Dirección demo';
  const logoUrl = '/icon-192.svg';

  return (
    <div className="p-2">
      <h3 className="font-bold mb-2">Ventas del turno</h3>
      {sales.length === 0 ? (
        <div className="text-gray-500">No hay ventas registradas en este turno.</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-1">Cliente</th>
              <th className="text-right p-1">Total</th>
              <th className="text-right p-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id} className={sale.estado === 'cancelada' ? 'opacity-50' : ''}>
                <td className="p-1">{sale.cliente_id || '-'}</td>
                <td className="p-1 text-right">{formatMoney(sale.total || 0)}</td>
                <td className="p-1 text-right flex gap-2 justify-end">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    onClick={() => handleEdit(sale)}
                    disabled={sale.estado === 'cancelada'}
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    onClick={() => handleReprint(sale)}
                    disabled={sale.estado === 'cancelada'}
                    title="Reimprimir ticket"
                  >
                    Reimprimir
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                    onClick={() => handleCancel(sale)}
                    disabled={sale.estado === 'cancelada' || cancellingId === sale.id}
                    title="Cancelar venta"
                  >
                    {cancellingId === sale.id ? 'Cancelando...' : 'Cancelar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Hidden ticket for printing */}
      {printingSale && printingItems.length > 0 && (
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div ref={ticketRef}>
            <Ticket55mm
              logoUrl={logoUrl}
              companyName={companyName}
              companyAddress={companyAddress}
              date={printingSale.fecha ? new Date(printingSale.fecha).toLocaleString() : ''}
              saleCode={printingSale.codigo_venta || ''}
              clientName={printingSale.cliente_id || ''}
              products={printingItems.map((item: any) => ({
                name: item.product_name,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity,
                discount: item.discount_amount || 0,
              }))}
              total={printingSale.total}
              paymentBreakdown={[{ type: printingSale.metodo_pago === 'efectivo' ? 'efectivo' : 'digital', amount: printingSale.total }]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default SalesPanel;
