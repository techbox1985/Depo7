import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { formatMoney } from '../../utils/money';
import { Spinner } from '../ui/Spinner';
import { OrderDetailsModal } from './OrderDetailsModal';
import { Search, Ban, Printer, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { buildPrintHtml, PostActionData } from '../pos/Cart';

type Sale = {
  id: string;
  total: number;
  estado: 'completada' | 'pendiente' | 'presupuesto' | 'anulada' | 'cancelada' | 'cancelled';
  creado_en: string;
  codigo_venta?: string;
  customers?: {
    name: string;
  };
};

export const OrdersView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers ( name )
      `)
      .order('creado_en', { ascending: false });

    if (error) console.error('Error fetching sales:', error);
    else setSales((data as Sale[]) || []);
    setLoading(false);
  };

  const isCancelled = (estado: string) => ['anulada', 'cancelada', 'cancelled'].includes(estado.toLowerCase());

  const handleCancel = async (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    if (isCancelled(sale.estado)) return;
    if (!window.confirm(`¿Estás seguro de que deseas anular el movimiento ${sale.codigo_venta || sale.id}?`)) return;
    
    setActionLoading(sale.id);
    try {
      const { error } = await supabase.rpc('anular_venta', { p_sale_id: sale.id });
      if (error) throw error;
      await fetchSales();
    } catch (e) {
      console.error('Error al cancelar:', e);
      alert('Error al cancelar el movimiento.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprint = async (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    
    // Fetch items to build print data
    const { data: items, error } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id);

    if (error) {
      alert('Error al obtener datos para impresión.');
      return;
    }

    const printData: PostActionData = {
      status: sale.estado === 'completada' ? 'completada' : sale.estado === 'presupuesto' ? 'presupuesto' : 'pendiente',
      items: (items || []).map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal: (items || []).reduce((acc, item) => acc + item.price * item.quantity, 0),
      total: sale.total,
      createdAt: sale.creado_en,
    };

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(printData));
    printWindow.document.close();
  };

  const handleEdit = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    alert(`La edición del movimiento ${sale.codigo_venta || sale.id} no está implementada.`);
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchEstado = filtroEstado === 'todos' || 
                          (filtroEstado === 'cancelada' ? isCancelled(s.estado) : s.estado === filtroEstado);
      const matchBusqueda = 
        s.customers?.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigo_venta?.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [sales, filtroEstado, busqueda]);

  const stats = useMemo(() => {
    return {
      totalVendido: sales.filter(s => s.estado === 'completada').reduce((acc, s) => acc + Number(s.total), 0),
      ventas: sales.filter(s => s.estado === 'completada').length,
      pedidos: sales.filter(s => s.estado === 'pendiente').length,
      canceladas: sales.filter(s => isCancelled(s.estado)).length,
      presupuestos: sales.filter(s => s.estado === 'presupuesto').length,
    };
  }, [sales]);

  const getEstadoColor = (estado: string) => {
    if (isCancelled(estado)) return 'bg-red-100 text-red-700 border-red-200';
    switch (estado) {
      case 'completada': return 'bg-green-100 text-green-700 border-green-200';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'presupuesto': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Vendido', value: formatMoney(stats.totalVendido) },
          { label: 'Ventas', value: stats.ventas },
          { label: 'Pedidos', value: stats.pedidos },
          { label: 'Canceladas', value: stats.canceladas },
          { label: 'Presupuestos', value: stats.presupuestos },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

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
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(sale)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.codigo_venta || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.creado_en).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customers?.name || 'Consumidor Final'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getEstadoColor(sale.estado)}`}>
                    {sale.estado.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{formatMoney(Number(sale.total))}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => handleReprint(e, sale)} className="text-gray-600 hover:text-gray-800" title="Reimprimir">
                      <Printer className="h-4 w-4" />
                    </Button>
                    {!isCancelled(sale.estado) && (
                      <Button variant="ghost" size="sm" onClick={(e) => handleEdit(e, sale)} className="text-blue-600 hover:text-blue-800" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {!isCancelled(sale.estado) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleCancel(e, sale)}
                        disabled={actionLoading === sale.id}
                        className="text-red-600 hover:text-red-800"
                        title="Anular"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailsModal
          isOpen={!!selected}
          order={selected}
          onClose={() => setSelected(null)}
          onActionComplete={fetchSales}
        />
      )}
    </div>
  );
};
