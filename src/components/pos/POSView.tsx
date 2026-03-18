import React, { useEffect, useState } from 'react';
import { ProductGrid } from '../products/ProductGrid';
import { POSSidebar } from './POSSidebar';
import { useCashStore } from '../../store/useCashStore';
import { CashModal } from './CashModal';
import { Spinner } from '../ui/Spinner';

export const POSView: React.FC = () => {
  const { currentSession, isLoading, fetchCurrentSession } = useCashStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Traer la sesión actual de caja al montar
  useEffect(() => {
    fetchCurrentSession();
  }, [fetchCurrentSession]);

  // Abrir modal obligatorio si no hay caja activa
  useEffect(() => {
    if (!isLoading && !currentSession) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [isLoading, currentSession]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    // ✅ FIX: reemplazado "h-full" por "flex-1 min-h-0"
    // "h-full" tomaba el 100% del viewport incluyendo el menú lateral.
    // "flex-1 min-h-0" hace que el componente ocupe solo el espacio
    // disponible dentro de su contenedor padre (el área de contenido),
    // respetando el layout general de la app.
    <div className="absolute inset-0 flex flex-col lg:flex-row overflow-hidden">
      {/* ProductGrid bloqueado/desenfocado si no hay caja */}
      <div
        className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${
          !currentSession ? 'opacity-50 blur-sm pointer-events-none' : ''
        } transition-all duration-300`}
      >
        <ProductGrid />
      </div>

      {/* Sidebar siempre interactivo */}
      <div className="w-full lg:w-96 border-l border-gray-200 bg-white flex-shrink-0 h-[50vh] lg:h-full flex flex-col transition-all duration-300">
        <POSSidebar />
      </div>

      {/* Modal obligatorio de apertura de caja */}
      {!currentSession && isModalOpen && (
        <CashModal
          isOpen={isModalOpen}
          onClose={() => {}}
          type="open"
          mandatory={true}
        />
      )}
    </div>
  );
};
