import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCashStore } from '../../store/useCashStore';
import { Spinner } from '../ui/Spinner';
import { Printer, Ban, Search, Calendar, DollarSign, FileText, CheckCircle, X } from 'lucide-react';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './Cart';

type SaleRow = {
  id: string;
  codigo_venta?: string;
  estado: 'completada' | 'pendiente' | 'presupuesto' | 'anulada' | 'cancelada' | 'cancelled';
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

const isCancelledSale = (sale: SaleRow) => {
  const estado = String(sale.estado || '').toLowerCase();
  return ['anulada', 'cancelada', 'cancelled'].includes(estado);
};

export const DailySales: React.FC = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<string | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<SaleRow | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const fetchSales = async () => {
    setLoading(true);
    setUiError(null);

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
      setUiError(`No se pudieron cargar las ventas: ${error.message}`);
      setSales([]);
    } else {
      setSales((data as SaleRow[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, [currentSession]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchEstado = filtroEstado === 'todos' || s.estado === filtroEstado || (filtroEstado === 'anulada' && isCancelledSale(s));
      const matchBusqueda =
        s.customers?.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigo_venta?.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [sales, filtroEstado, busqueda]);

  const stats = useMemo(() => {
    return {
      totalVendido: sales.filter((s) => s.estado === 'completada').reduce((acc, s) => acc + Number(s.total || 0), 0),
      ventas: sales.filter((s) => s.estado === 'completada').length,
      pedidos: sales.filter((s) => s.estado === 'pendiente').length,
      canceladas: sales.filter((s) => isCancelledSale(s)).length,
      presupuestos: sales.filter((s) => s.estado === 'presupuesto').length,
    };
  }, [sales]);

  const getEstadoColor = (estado: string) => {
    if (['anulada', 'cancelada', 'cancelled'].includes(estado.toLowerCase())) return 'bg-red-100 text-red-700 border-red-200';
    switch (estado) {
      case 'completada': return 'bg-green-100 text-green-700 border-green-200';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'presupuesto': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleReprint = async (sale: SaleRow) => {
    try {
      setPrintingSaleId(sale.id);
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select(`product_id, product_name, quantity, price, products(name)`)
        .eq('sale_id', sale.id);

      if (error) throw error;

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
      if (printWindow) {
        printWindow.document.write(buildPrintHtml(ticketData));
        printWindow.document.close();
      }
    } catch (err: any) {
      setUiError(`Error al reimprimir: ${err.message}`);
    } finally {
      setPrintingSaleId(null);
    }
  };

  const confirmCancelSale = async () => {
    if (!saleToCancel) return;
    try {
      setCancellingSaleId(saleToCancel.id);
      const { error } = await supabase.rpc('anular_venta', { p_sale_id: saleToCancel.id });
      if (error) throw error;
      setUiSuccess(`Venta anulada correctamente.`);
      setSaleToCancel(null);
      await fetchSales();
    } catch (error: any) {
      setUiError(`Error al anular: ${error.message}`);
    } finally {
      setCancellingSaleId(null);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner size="md" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Vendido', value: formatCurrency(stats.totalVendido), icon: DollarSign },
          { label: 'Ventas', value: stats.ventas, icon: CheckCircle },
          { label: 'Pedidos', value: stats.pedidos, icon: FileText },
          { label: 'Canceladas', value: stats.canceladas, icon: X },
          { label: 'Presupuestos', value: stats.presupuestos, icon: FileText },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><stat.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o código..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="completada">Ventas</option>
          <option value="pendiente">Pedidos</option>
          <option value="presupuesto">Presupuestos</option>
          <option value="anulada">Canceladas</option>
        </select>
      </div>

      {/* Lista */}
      <div className="grid gap-3">
        {filteredSales.map((sale) => (
          <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${getEstadoColor(sale.estado)}`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{sale.customers?.name || 'Consumidor Final'}</p>
                <p className="text-xs text-gray-500">{new Date(sale.creado_en || sale.fecha || '').toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getEstadoColor(sale.estado)}`}>
                {sale.estado.toUpperCase()}
              </span>
              <p className="font-bold text-lg text-gray-900 w-24 text-right">{formatCurrency(sale.total)}</p>
              <div className="flex gap-2">
                <button onClick={() => handleReprint(sale)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Printer className="h-4 w-4" /></button>
                {!isCancelledSale(sale) && (
                  <button onClick={() => setSaleToCancel(sale)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Ban className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal Cancelar */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Confirmar anulación</h3>
            <p className="mb-6 text-gray-600">¿Estás seguro de anular la venta {saleToCancel.codigo_venta || saleToCancel.id}?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSaleToCancel(null)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              <button onClick={confirmCancelSale} className="px-4 py-2 rounded-lg bg-red-600 text-white">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};