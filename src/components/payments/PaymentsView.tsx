import React, { useEffect, useState, useMemo } from 'react';
import { paymentsService } from '../../services/paymentsService';
import { customersService } from '../../services/customersService';
import { CustomerPayment } from '../../types';
import { PaymentFormModal } from './PaymentFormModal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';


const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<CustomerPayment | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  // Filtros
  const [filter, setFilter] = useState({
    from: '',
    to: '',
    customer_id: '',
    payment_method: '',
  });
  // Filtros y resumen
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const date = p.payment_date?.slice(0, 10);
      if (filter.from && date < filter.from) return false;
      if (filter.to && date > filter.to) return false;
      if (filter.customer_id && p.customer_id !== filter.customer_id) return false;
      if (filter.payment_method && p.payment_method !== filter.payment_method) return false;
      return true;
    });
  }, [payments, filter]);

  const resumen = useMemo(() => {
    let total = 0, count = 0, efectivo = 0, transferencia = 0, mp = 0;
    for (const p of filteredPayments) {
      total += p.amount;
      count++;
      if (p.payment_method === 'Efectivo') efectivo += p.amount;
      else if (p.payment_method === 'Transferencia') transferencia += p.amount;
      else if (p.payment_method === 'Mercado Pago') mp += p.amount;
    }
    return { total, count, efectivo, transferencia, mp };
  }, [filteredPayments]);

  const fetchPayments = () => {
    setLoading(true);
    paymentsService.listPayments()
      .then(setPayments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    customersService.getCustomers().then(setCustomers);
  }, []);

  const handleSave = async (data: Partial<CustomerPayment>) => {
    try {
      if (editPayment) {
        await paymentsService.updatePayment(editPayment.id, data);
      } else {
        await paymentsService.createPayment(data);
      }
      setModalOpen(false);
      setEditPayment(null);
      fetchPayments();
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    try {
      await paymentsService.deletePayment(id);
      fetchPayments();
    } catch (e: any) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Pagos de Clientes</h1>
        <Button size="md" variant="primary" onClick={() => { setEditPayment(null); setModalOpen(true); }}>
          Cargar pago
        </Button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-linear-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 p-5 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Total cobrado</span>
          <span className="text-3xl font-bold text-indigo-700">${resumen.total.toFixed(2)}</span>
        </div>
        <div className="bg-linear-to-br from-green-50 to-white rounded-xl shadow-sm border border-green-100 p-5 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Cantidad de pagos</span>
          <span className="text-3xl font-bold text-green-700">{resumen.count}</span>
        </div>
        <div className="bg-linear-to-br from-yellow-50 to-white rounded-xl shadow-sm border border-yellow-100 p-5 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Total efectivo</span>
          <span className="text-3xl font-bold text-yellow-700">${resumen.efectivo.toFixed(2)}</span>
        </div>
        <div className="bg-linear-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-100 p-5 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Total transferencia</span>
          <span className="text-3xl font-bold text-blue-700">${resumen.transferencia.toFixed(2)}</span>
        </div>
        <div className="bg-linear-to-br from-pink-50 to-white rounded-xl shadow-sm border border-pink-100 p-5 flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-1">Total Mercado Pago</span>
          <span className="text-3xl font-bold text-pink-700">${resumen.mp.toFixed(2)}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-wrap gap-4 items-end">
        <div className="w-36">
          <Input label="Fecha desde" type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} />
        </div>
        <div className="w-36">
          <Input label="Fecha hasta" type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select className="w-full border rounded-md h-10 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" value={filter.customer_id} onChange={e => setFilter(f => ({ ...f, customer_id: e.target.value }))}>
            <option value="">Todos</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
          <select className="w-full border rounded-md h-10 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" value={filter.payment_method} onChange={e => setFilter(f => ({ ...f, payment_method: e.target.value }))}>
            <option value="">Todos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>
        <Button variant="secondary" size="md" onClick={() => setFilter({ from: '', to: '', customer_id: '', payment_method: '' })} type="button">
          Limpiar filtros
        </Button>
      </div>

      {modalOpen && (
        <PaymentFormModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditPayment(null); }}
          onSave={handleSave}
          initialData={editPayment || {}}
          customers={customers}
        />
      )}
      {loading && <div>Cargando pagos...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Método</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notas</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredPayments.map((p) => (
              <tr key={p.id} className="hover:bg-indigo-50 transition">
                <td className="px-4 py-2 whitespace-nowrap">{p.payment_date?.slice(0, 10)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{p.customer?.name || 'Cliente no encontrado'}</td>
                <td className="px-4 py-2 whitespace-nowrap font-semibold text-indigo-700">${p.amount.toFixed(2)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{p.payment_method}</td>
                <td className="px-4 py-2 whitespace-nowrap">{p.notes || ''}</td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <Button variant="ghost" size="sm" onClick={() => { setEditPayment(p); setModalOpen(true); }}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsView;
