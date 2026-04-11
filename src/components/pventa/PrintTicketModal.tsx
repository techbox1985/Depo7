import React from 'react';

interface PrintTicketModalProps {
  open: boolean;
  onPrint: () => void;
  onClose: () => void;
}

const PrintTicketModal: React.FC<PrintTicketModalProps> = ({ open, onPrint, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
        <div className="text-lg font-bold mb-4">¿Deseás imprimir el ticket?</div>
        <div className="flex gap-4 mt-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
            onClick={onPrint}
          >
            Imprimir
          </button>
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-400"
            onClick={onClose}
          >
            No imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintTicketModal;
