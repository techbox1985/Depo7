import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Printer, Pencil, Ban } from 'lucide-react';
import { OrderDetailsModal } from './OrderDetailsModal';
import { buildPrintHtml, PostActionData, CartSnapshotItem } from '../pos/Cart';

type Sale = {
  id: string;
  codigo_venta: string;
  cliente_id: string | null;
  caja_id: string | null;
  total: number;
  estado: string;
  metodo_pago: string | null;
  tipo_digital: string | null;
  cuotas: number | null;
  monto_efectivo: number | null;
  monto_digital: number | null;
  tipo_descuento: string | null;
  valor_descuento: number | null;
  total_productos: number | null;
  fecha: string;
  creado_en: string;
  actualizado_en: string;
  price_list?: string | null;
  customers?: { name?: string | null } | null;
};

const formatMoney = (value: number | null | undefined) =>
  `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`;

const isCancelled = (estado?: string | null) => {
  if (!estado) return false;
  const e = estado.toLowerCase().trim();
  return e === 'anulada' || e === 'cancelada' || e === 'cancelled';
};

export const OrdersView: React.FC = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSales((data as Sale[]) || []);
    }
    setLoading(false);
  };

  const stats = useMemo(() => {
    const ventas = sales.filter((s) => s.estado === 'completada');
    const pedidos = sales.filter((s) => s.estado === 'pendiente');
    const canceladas = sales.filter((s) => isCancelled(s.estado));
    const presupuestos = sales.filter((s) => s.estado === 'presupuesto');

    return {
      totalVendido: ventas.reduce((acc, s) => acc + Number(s.total || 0), 0),
      ventas: ventas.length,
      pedidos: pedidos.length,
      canceladas: canceladas.length,
      presupuestos: presupuestos.length,
    };
  }, [sales]);

  const salesFiltradas = useMemo(() => {
    return sales.filter((sale) => {
      const texto =
        `${sale.codigo_venta || ''} ${sale.customers?.name || 'Consumidor Final'}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      let coincideEstado = true;
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'cancelada') coincideEstado = isCancelled(sale.estado);
        else coincideEstado = sale.estado === filtroEstado;
      }

      let coincideFecha = true;
      const fechaSale = new Date(sale.fecha || sale.creado_en).toISOString().split('T')[0];
      if (fechaDesde) coincideFecha = coincideFecha && fechaSale >= fechaDesde;
      if (fechaHasta) coincideFecha = coincideFecha && fechaSale <= fechaHasta;

      return coincideBusqueda && coincideEstado && coincideFecha;
    });
  }, [sales, busqueda, filtroEstado, fechaDesde, fechaHasta]);

  const handleCancel = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    if (isCancelled(sale.estado)) {
      alert('La venta ya está cancelada');
      return;
    }
    setSaleToCancel(sale);
  };

  const confirmCancel = async () => {
    if (!saleToCancel) return;
    setActionLoading(saleToCancel.id);
    try {
      const { error } = await supabase.rpc('anular_venta', {
        p_sale_id: saleToCancel.id,
      });
      if (error) throw error;
      alert('Movimiento anulado correctamente');
      setSaleToCancel(null);
      await fetchSales();
    } catch (e: any) {
      console.error('Error cancelar venta', e);
      alert(`Error al cancelar el movimiento: ${e?.message || 'sin detalle'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprint = async (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    try {
      const { data: items, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', sale.id);

      if (error) {
        alert('Error al obtener datos para impresión.');
        return;
      }

      const cartItems: CartSnapshotItem[] = (items || []).map((item: any) => ({
        productId: item.product_id || '',
        productName: item.product_name || 'Producto',
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.price || 0),
        subtotal: Math.round(Number(item.quantity || 0) * Number(item.price || 0)),
      }));

      const ticketData: PostActionData = {
        status: sale.estado,
        items: cartItems,
        subtotal: cartItems.reduce((acc, item) => acc + item.subtotal, 0),
        total: Number(sale.total || 0),
        createdAt: sale.fecha || sale.creado_en || new Date().toISOString(),
      };

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('El navegador bloqueó la ventana de impresión.');
        return;
      }
      printWindow.document.write(buildPrintHtml(ticketData));
      printWindow.document.close();
    } catch (e) {
      console.error('Error al reimprimir:', e);
      alert('Error al reimprimir el ticket.');
    }
  };

  const handleEdit = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    console.log('EDITAR → POS', sale.id);
    localStorage.setItem('pos_edit_sale_id', sale.id);
    navigate('/pos');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial de Movimientos</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Vendido', value: formatMoney(stats.totalVendido) },
          { label: 'Ventas', value: stats.ventas },
          { label: 'Pedidos', value: stats.pedidos },
          { label: 'Canceladas', value: stats.canceladas },
          { label: 'Presupuestos', value: stats.presupuestos },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar cliente/código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-4 py-2 text-sm"
        />
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="completada">Completadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="presupuesto">Presupuestos</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Código</th>
              <th className="px-6 py-4 text-left font-semibold">Fecha</th>
              <th className="px-6 py-4 text-left font-semibold">Cliente</th>
              <th className="px-6 py-4 text-left font-semibold">Estado</th>
              <th className="px-6 py-4 text-right font-semibold">Total</th>
              <th className="px-6 py-4 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>Cargando...</td>
              </tr>
            ) : salesFiltradas.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>No hay movimientos</td>
              </tr>
            ) : (
              salesFiltradas.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(sale)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{sale.codigo_venta}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(sale.fecha || sale.creado_en).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{sale.customers?.name || 'Consumidor Final'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isCancelled(sale.estado)
                          ? 'bg-red-50 text-red-700'
                          : sale.estado === 'completada'
                          ? 'bg-green-50 text-green-700'
                          : sale.estado === 'pendiente'
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {isCancelled(sale.estado)
                        ? 'CANCELADA'
                        : String(sale.estado).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-right">{formatMoney(sale.total)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleReprint(e, sale)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Reimprimir"
                      >
                        <Printer size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, sale)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>

                      {!isCancelled(sale.estado) && (
                        <button
                          type="button"
                          onClick={(e) => handleCancel(e, sale)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Anular"
                          disabled={actionLoading === sale.id}
                        >
                          <Ban size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailsModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          order={selected}
          onActionComplete={async () => {
            setSelected(null);
            await fetchSales();
          }}
        />
      )}

      {saleToCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-2">Confirmar anulación</h2>
            <p className="text-sm text-gray-600 mb-6">
              ¿Seguro que querés anular el movimiento{' '}
              <span className="font-semibold">
                {saleToCancel.codigo_venta || saleToCancel.id}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border"
                onClick={() => setSaleToCancel(null)}
              >
                Volver
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white"
                onClick={confirmCancel}
                disabled={actionLoading === saleToCancel.id}
              >
                Confirmar anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};