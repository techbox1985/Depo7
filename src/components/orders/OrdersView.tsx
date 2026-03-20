import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { formatMoney } from '../../utils/money';
import { Spinner } from '../ui/Spinner';
import { OrderDetailsModal } from './OrderDetailsModal';
import { Search, Calendar } from 'lucide-react';

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

      <div className="grid gap-3">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            onClick={() => setSelected(sale)}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${getEstadoColor(sale.estado)}`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{sale.customers?.name || 'Consumidor Final'}</p>
                <p className="text-xs text-gray-500">{new Date(sale.creado_en).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getEstadoColor(sale.estado)}`}>
                {sale.estado.toUpperCase()}
              </span>
              <p className="font-bold text-lg text-gray-900 w-24 text-right">{formatMoney(Number(sale.total))}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <OrderDetailsModal
          isOpen={!!selected}
          order={selected}
          onClose={() => setSelected(null)}
          onConvertToSale={fetchSales}
        />
      )}
    </div>
  );
};