import React, { useState } from 'react';
import { CustomerPayment } from '../../types';

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CustomerPayment>) => void;
  initialData?: Partial<CustomerPayment>;
  customers: { id: string; name: string }[];
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({ open, onClose, onSave, initialData = {}, customers }) => {
  const [form, setForm] = useState<Partial<CustomerPayment>>({
    customer_id: initialData.customer_id || '',
    amount: initialData.amount || 0,
    payment_method: initialData.payment_method || '',
    notes: initialData.notes || '',
    payment_date: initialData.payment_date || new Date().toISOString().slice(0, 10),
    cash_closing_id: initialData.cash_closing_id || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payment_method) {
      alert('Debe seleccionar un método de pago.');
      return;
    }
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{initialData.id ? 'Editar pago' : 'Nuevo pago'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-sm">Cliente</label>
            <select name="customer_id" value={form.customer_id} onChange={handleChange} required className="w-full border p-2 rounded">
              <option value="">Seleccionar cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm">Monto</label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} required className="w-full border p-2 rounded" min="0" step="0.01" />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Método</label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccionar método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Mercado Pago">Mercado Pago</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm">Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Fecha</label>
            <input type="date" name="payment_date" value={form.payment_date?.slice(0,10)} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div className="mb-2">
            <label className="block text-sm">Caja/Turno (opcional)</label>
            <input name="cash_closing_id" value={form.cash_closing_id || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
