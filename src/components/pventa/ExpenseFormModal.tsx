import React, { useState } from 'react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { concept: string; description: string; amount: number; payment_method: string }) => void;
  initialData?: {
    concept?: string;
    description?: string;
    amount?: number;
    payment_method?: string;
  };
  mode?: 'pos' | 'general';
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, initialData, mode = 'general' }) => {
  // POS: concept fijo 'POS' solo en alta y edición. General: select editable siempre, pero nunca POS.
  const conceptOptions = [
    'POS',
    'General',
    'Impuestos',
    'Personal',
    'Proveedores',
  ];
  const isEdit = !!initialData && typeof initialData.concept !== 'undefined';

  // --- Estado controlado y reset por apertura/modal ---
  const [concept, setConcept] = useState('General');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [error, setError] = useState('');

  // Reset y normalización de estado al abrir modal o cambiar modo/initialData
  React.useEffect(() => {
    if (!isOpen) return;
    // Modo POS: siempre concept = 'POS', fijo
    if (mode === 'pos') {
      setConcept('POS');
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setPaymentMethod(initialData?.payment_method || 'efectivo');
      return;
    }
    // Modo GENERAL
    if (isEdit) {
      // Si concept es POS, forzar 'General'. Si no, usar el concept original.
      if (initialData?.concept === 'POS') {
        setConcept('General');
      } else if (initialData?.concept && conceptOptions.includes(initialData.concept)) {
        setConcept(initialData.concept);
      } else {
        setConcept('General');
      }
      setDescription(initialData?.description || '');
      setAmount(initialData?.amount?.toString() || '');
      setPaymentMethod(initialData?.payment_method || 'efectivo');
    } else {
      // Alta general: concept SIEMPRE 'General'
      setConcept('General');
      setDescription('');
      setAmount('');
      setPaymentMethod('efectivo');
    }
  }, [isOpen, mode, isEdit, initialData]);

  const handleSave = () => {
    if (!concept.trim() || !description.trim() || !amount || isNaN(Number(amount)) || !paymentMethod) {
      setError('Complete todos los campos correctamente.');
      return;
    }
    setError('');
    onSave({ concept: concept.trim(), description: description.trim(), amount: Number(amount), payment_method: paymentMethod });
    // Reset: forzar concept según modo
    if (mode === 'pos') {
      setConcept('POS');
    } else {
      setConcept('General');
    }
    setDescription('');
    setAmount('');
    setPaymentMethod('efectivo');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-4 w-80">
        <h2 className="font-bold mb-2">Cargar gasto</h2>
        <div className="mb-2">
          <label className="block text-sm">Concepto</label>
          {mode === 'pos' ? (
            <input
              className="border rounded px-2 py-1 w-full bg-gray-100 text-gray-700 font-bold"
              value={concept}
              disabled
              autoFocus
            />
          ) : (
            <select
              className="border rounded px-2 py-1 w-full"
              value={concept}
              onChange={e => setConcept(e.target.value)}
              autoFocus
            >
              {/* Ocultar POS en modo general */}
              {conceptOptions.filter(opt => opt !== 'POS').map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
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
        <div className="mb-2">
          <label className="block text-sm">Forma de pago</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            required
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">MercadoPago</option>
          </select>
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
