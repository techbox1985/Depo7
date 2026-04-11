import React, { useState } from 'react';

export const EditCustomerModal = ({ customer, open, onClose, onSave }) => {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-4 w-80">
        <h2 className="font-bold mb-2">Editar cliente</h2>
        <div className="mb-2">
          <label className="block text-sm">Nombre</label>
          <input className="border rounded px-2 py-1 w-full" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Teléfono</label>
          <input className="border rounded px-2 py-1 w-full" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Dirección</label>
          <input className="border rounded px-2 py-1 w-full" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1" onClick={onClose}>Cancelar</button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            disabled={saving}
            onClick={async () => {
              if (!name.trim() || !phone.trim() || !address.trim()) {
                setError('Todos los campos son obligatorios.');
                return;
              }
              setSaving(true);
              setError('');
              await onSave({ ...customer, name: name.trim(), phone: phone.trim(), address: address.trim() });
              setSaving(false);
            }}
          >Guardar</button>
        </div>
      </div>
    </div>
  );
};
