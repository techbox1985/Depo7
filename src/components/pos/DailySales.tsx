import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useCashStore } from '../../store/useCashStore';
import { Spinner } from '../ui/Spinner';
import { CheckCircle, Clock, FileText, Printer } from 'lucide-react';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from './Cart';

type SaleRow = {
  id: string;
  codigo_venta?: string;
  estado: 'completada' | 'pendiente' | 'presupuesto';
  total?: number;
  total_productos?: number;
  fecha?: string;
  creado_en?: string;
  metodo_pago?: 'efectivo' | 'digital' | 'mixto' | string | null;
  tipo_digital?: 'mercadopago' | 'transferencia' | 'tarjeta' | string | null;
  monto_efectivo?: number | null;
  monto_digital?: number | null;
  customers?: {
    name?: string | null;
  } | null;
};

const formatCurrency = (value: number | null | undefined) => {
  return `$${Math.round(Number(value || 0))}`;
};

const formatTime = (value?: string) => {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPaymentLabel = (sale: SaleRow) => {
  if (sale.metodo_pago === 'mixto') {
    const parts: string[] = [];
    if ((sale.monto_efectivo || 0) > 0) parts.push('Efectivo');
    if ((sale.monto_digital || 0) > 0) {
      const digitalLabel =
        sale.tipo_digital === 'mercadopago'
          ? 'Mercado Pago'
          : sale.tipo_digital === 'transferencia'
          ? 'Transferencia'
          : sale.tipo_digital === 'tarjeta'
          ? 'Tarjeta'
          : 'Digital';
      parts.push(digitalLabel);
    }
    return parts.length > 0 ? `Mixto (${parts.join(' + ')})` : 'Mixto';
  }

  if (sale.metodo_pago === 'digital') {
    if (sale.tipo_digital === 'mercadopago') return 'Mercado Pago';
    if (sale.tipo_digital === 'transferencia') return 'Transferencia';
    if (sale.tipo_digital === 'tarjeta') return 'Tarjeta';
    return 'Digital';
  }

  if (sale.metodo_pago === 'efectivo') return 'Efectivo';

  return '-';
};

const sectionStyles = {
  completada: {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    title: 'Ventas Completadas',
    badge: 'bg-green-100 text-green-700',
  },
  pendiente: {
    icon: <Clock className="h-4 w-4 text-amber-500" />,
    title: 'Pedidos Pendientes',
    badge: 'bg-amber-100 text-amber-700',
  },
  presupuesto: {
    icon: <FileText className="h-4 w-4 text-blue-500" />,
    title: 'Presupuestos',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export const DailySales: React.FC = () => {
  const { currentSession } = useCashStore();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);

      let query = supabase
        .from('sales')
        .select(
          `
            id,
            codigo_venta,
            estado,
            total,
            total_productos,
            fecha,
            creado_en,
            metodo_pago,
            tipo_digital,
            monto_efectivo,
            monto_digital,
            customers(name)
          `
        )
        .order('creado_en', { ascending: false });

      const { data, error } = await query;

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

  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesSearch = search === '' || (s.customers?.name?.toLowerCase().includes(search.toLowerCase()) || s.codigo_venta?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'todos' || s.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, search, statusFilter]);

  const summary = useMemo(() => {
    const total = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const count = sales.length;
    const pos = sales.filter(s => !s.codigo_venta?.startsWith('PED')).length;
    const pedidos = sales.filter(s => s.codigo_venta?.startsWith('PED')).length;
    return { total, count, pos, pedidos };
  }, [sales]);

  const groupedSales = useMemo(() => {
    return {
      completada: filteredSales.filter((s) => s.estado === 'completada'),
      pendiente: filteredSales.filter((s) => s.estado === 'pendiente'),
      presupuesto: filteredSales.filter((s) => s.estado === 'presupuesto'),
    };
  }, [filteredSales]);

  const handleReprint = async (sale: SaleRow) => {
    try {
      setPrintingSaleId(sale.id);

      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select(
          `
            product_id,
            product_name,
            quantity,
            price,
            products(name)
          `
        )
        .eq('sale_id', sale.id)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error loading sale items for reprint:', error);
        alert('No se pudieron cargar los productos de la venta para reimprimir.');
        return;
      }

      const normalizedItems: CartSnapshotItem[] = (saleItems || []).map(
        (item: any) => {
          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.price || 0);
          const productName =
            item.product_name ||
            item.products?.name ||
            'Producto';

          return {
            productId: item.product_id || '',
            productName,
            quantity,
            unitPrice,
            subtotal: Math.round(unitPrice * quantity),
          };
        }
      );

      if (normalizedItems.length === 0) {
        alert('Esta venta no tiene detalle de productos para reimprimir.');
        return;
      }

      const subtotal = normalizedItems.reduce((acc, item) => acc + item.subtotal, 0);

      const ticketData: PostActionData = {
        status: sale.estado,
        items: normalizedItems,
        subtotal,
        total: Math.round(Number(sale.total || subtotal)),
        createdAt: sale.fecha || sale.creado_en || new Date().toISOString(),
      };

      const printWindow = window.open('', '_blank', 'width=900,height=700');

      if (!printWindow) {
        alert('No se pudo abrir la ventana de impresión.');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(buildPrintHtml(ticketData));
      printWindow.document.close();
    } catch (err) {
      console.error('Error reprinting ticket:', err);
      alert('Ocurrió un error al reimprimir el ticket.');
    } finally {
      setPrintingSaleId(null);
    }
  };

  const renderSection = (
    status: 'completada' | 'pendiente' | 'presupuesto',
    rows: SaleRow[]
  ) => {
    if (rows.length === 0) return null;

    const style = sectionStyles[status];

    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          {style.icon}
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {style.title}
          </h4>
          <span
            className={`ml-auto py-0.5 px-2 rounded-full text-xs font-medium ${style.badge}`}
          >
            {rows.length}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Comprobante</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Pago</th>
                  <th className="px-3 py-2 text-center">Items</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((sale) => {
                  const productCount = sale.total_productos || 0;

                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {formatTime(sale.fecha || sale.creado_en)}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                        {sale.codigo_venta || '-'}
                      </td>

                      <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate">
                        {sale.customers?.name || 'Consumidor Final'}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.codigo_venta?.startsWith('PED') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {sale.codigo_venta?.startsWith('PED') ? 'Pedido' : 'POS'}
                        </span>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {getPaymentLabel(sale)}
                      </td>

                      <td className="px-3 py-2 text-center text-gray-600">
                        {productCount}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatCurrency(sale.total)}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleReprint(sale)}
                          disabled={printingSaleId === sale.id}
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Reimprimir comprobante"
                        >
                          {printingSaleId === sale.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Vendido</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.total)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Cantidad</p>
          <p className="text-xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Ventas POS</p>
          <p className="text-xl font-bold text-gray-900">{summary.pos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Ventas Pedido</p>
          <p className="text-xl font-bold text-gray-900">{summary.pedidos}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Buscar cliente o código..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 border border-gray-300 rounded-lg flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg">
          <option value="todos">Todos los estados</option>
          <option value="completada">Completada</option>
          <option value="pendiente">Pendiente</option>
          <option value="presupuesto">Presupuesto</option>
        </select>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">No hay movimientos registrados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection('completada', groupedSales.completada)}
          {renderSection('pendiente', groupedSales.pendiente)}
          {renderSection('presupuesto', groupedSales.presupuesto)}
        </div>
      )}
    </div>
  );
};