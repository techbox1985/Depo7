import React, { useEffect, useState } from 'react';
import { getCustomerDebt } from '../../utils/debtUtils';
import { supabase } from '../../services/supabaseClient';

interface CustomerDetailModalProps {
  customer: any;
  open: boolean;
  onClose: () => void;
}

const CustomerDetailModal = ({ customer, open, onClose }: CustomerDetailModalProps) => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !customer) return;
    const fetchData = async () => {
      setLoading(true);
      // Ventas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('cliente_id', customer.id)
        .order('fecha', { ascending: true });
      // Pagos
      let paymentsData: any[] = [];
      let paymentsError = null;
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('customer_id', customer.id)
          .order('fecha', { ascending: true });
        paymentsData = data || [];
        paymentsError = error;
      } catch (e) {
        paymentsError = e;
      }
      setSales(salesData || []);
      setPayments(paymentsData || []);
      setLoading(false);
    };
    fetchData();
  }, [open, customer]);

  // Calcular totales
  const totalVendido = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalPagado = payments.reduce((acc, p) => acc + (Number(p.importe) || 0), 0);
  const deuda = getCustomerDebt(customer?.debt_initial, totalVendido, totalPagado);

  // Unificar historial
  const movimientos = [
    ...sales.map(s => ({
      tipo: 'Venta',
      fecha: s.fecha || s.created_at,
      descripcion: s.codigo_venta || 'Venta',
      importe: s.total,
      id: s.id,
    })),
    ...payments.map(p => ({
      tipo: 'Pago',
      fecha: p.fecha || p.created_at,
      descripcion: p.descripcion || 'Pago',
      importe: p.importe,
      id: p.id,
    })),
  ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Calcular saldo acumulado
  let saldo = 0;
  const movimientosConSaldo = movimientos.map(mov => {
    if (mov.tipo === 'Venta') saldo += Number(mov.importe) || 0;
    else if (mov.tipo === 'Pago') saldo -= Number(mov.importe) || 0;
    return { ...mov, saldo: saldo };
  });

  if (!open || !customer) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <button className="text-gray-500" onClick={onClose}>✕</button>
        </div>
        <div className="mb-2 flex gap-6">
          <div className="text-sm text-gray-600 flex-1">{customer.email}</div>
          <div className="text-sm text-gray-600 flex-1">{customer.phone}</div>
          <div className="text-sm text-gray-600 flex-1">{customer.location_address || <span className='italic text-gray-400'>Sin ubicación</span>}</div>
        </div>
        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 mt-2">
          <div className="bg-green-50 rounded shadow p-4 flex flex-col items-center">
            <div className="text-lg font-bold text-green-700">${totalVendido.toLocaleString('es-AR')}</div>
            <div className="text-gray-600">Total vendido</div>
          </div>
          <div className="bg-blue-50 rounded shadow p-4 flex flex-col items-center">
            <div className="text-lg font-bold text-blue-700">${totalPagado.toLocaleString('es-AR')}</div>
            <div className="text-gray-600">Total pagado</div>
          </div>
          <div className="bg-red-50 rounded shadow p-4 flex flex-col items-center">
            <div className="text-lg font-bold text-red-700">${deuda.toLocaleString('es-AR')}</div>
            <div className="text-gray-600">Deuda actual</div>
          </div>
        </div>
        {/* Historial unificado */}
        <div className="mb-2 font-semibold text-lg">Historial de cuenta corriente</div>
        {loading ? (
          <div className="text-gray-500">Cargando movimientos...</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-xs bg-white rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-right p-2">Importe</th>
                  <th className="text-right p-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimientosConSaldo.map(mov => (
                  <tr key={mov.tipo + '-' + mov.id}>
                    <td className="p-2">{mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '-'}</td>
                    <td className="p-2">{mov.tipo}</td>
                    <td className="p-2">{mov.descripcion}</td>
                    <td className={`p-2 text-right ${mov.tipo === 'Venta' ? 'text-green-700' : 'text-blue-700'}`}>{mov.tipo === 'Venta' ? '+' : '-'}${Number(mov.importe).toLocaleString('es-AR')}</td>
                    <td className="p-2 text-right font-semibold">${Number(mov.saldo).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movimientosConSaldo.length === 0 && <div className="text-gray-400 p-4">Sin movimientos.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;
