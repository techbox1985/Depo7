import React, { useState, useEffect } from 'react';

const emptyCustomer = { name: '', email: '', phone: '', location_address: '', debt_initial: 0 };

const CustomerFormModal = ({ open, onClose, onSave, initial }) => {
  const [customer, setCustomer] = useState(emptyCustomer);
  useEffect(() => {
    setCustomer(initial || emptyCustomer);
  }, [initial, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">{initial ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input className="border rounded px-2 py-1 w-full" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="border rounded px-2 py-1 w-full" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input className="border rounded px-2 py-1 w-full" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Dirección (ubicación)</label>
          <input className="border rounded px-2 py-1 w-full" value={customer.location_address || ''} onChange={e => setCustomer({ ...customer, location_address: e.target.value })} />
          <div className="text-xs text-gray-500 mt-1">La ubicación exacta se completará automáticamente en visitas o entregas futuras.</div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Deuda inicial</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={customer.debt_initial ?? 0} min="0" step="0.01" onChange={e => setCustomer({ ...customer, debt_initial: Number(e.target.value) })} />
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 rounded bg-indigo-600 text-white font-bold" onClick={() => onSave({
            ...customer,
            latitude: customer.latitude === '' ? null : Number(customer.latitude),
            longitude: customer.longitude === '' ? null : Number(customer.longitude),
            debt_initial: customer.debt_initial ?? 0
          })}>{initial ? 'Guardar' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
