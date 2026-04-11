import React, { useState } from 'react';

interface OpenCashModalProps {
  onOpen: (amount: number) => void;
}

const OpenCashModal: React.FC<OpenCashModalProps> = ({ onOpen }) => {
  const [amount, setAmount] = useState(0);
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onOpen(amount);
    setOpen(false);
  };

  return (
    <>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded font-bold mb-2"
        onClick={() => setOpen(true)}
      >
        Abrir caja
      </button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h2 className="text-lg font-bold mb-4">Abrir caja</h2>
            <label className="block mb-2">Monto inicial</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full mb-4"
              value={amount}
              min={0}
              onChange={e => setAmount(Number(e.target.value))}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-green-600 text-white font-bold" onClick={handleConfirm} disabled={amount <= 0}>Abrir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OpenCashModal;
