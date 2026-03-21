import React from 'react';
import { Modal } from '../ui/Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atajos de teclado">
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">General</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center"><span className="text-gray-700">Esc</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Cerrar ventana</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">?</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Ver atajos</span></li>
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">POS</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center"><span className="text-gray-700">↑ ↓</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Navegar productos</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">Enter</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Agregar producto</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">+ / -</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Cambiar cantidad</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">Delete</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Eliminar producto</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">F2</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Cobrar</span></li>
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tablas</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center"><span className="text-gray-700">↑ ↓</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Navegar filas</span></li>
            <li className="flex justify-between items-center"><span className="text-gray-700">Enter</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">Ver detalle</span></li>
          </ul>
        </section>
      </div>
    </Modal>
  );
};
