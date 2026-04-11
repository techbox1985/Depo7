import React, { useState } from 'react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { concept: string; description: string; amount: number }) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!concept.trim() || !description.trim() || !amount || isNaN(Number(amount))) {
      setError('Complete todos los campos correctamente.');
      return;
    }
    setError('');
    onSave({ concept: concept.trim(), description: description.trim(), amount: Number(amount) });
    setConcept('');
    setDescription('');
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-4 w-80">
        <h2 className="font-bold mb-2">Cargar gasto</h2>
        <div className="mb-2">
          <label className="block text-sm">Concepto</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={concept}
            onChange={e => setConcept(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Descripción</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Monto</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
        {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1" onClick={onClose}>Cancelar</button>
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
};
