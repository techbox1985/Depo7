import React, { useState } from 'react';
import { useCashStore } from '../../store/useCashStore';
import { Button } from '../ui/Button';
import { CashModal } from './CashModal';
import { Wallet, Lock, Unlock } from 'lucide-react';
import { formatMoney } from '../../utils/money';

export const CashRegister: React.FC = () => {
  const { currentSession } = useCashStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full p-6 items-center justify-center text-center bg-white">
      <div className={`p-6 rounded-full mb-6 ${currentSession ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        <Wallet className="h-12 w-12" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {currentSession ? 'Caja Abierta' : 'Caja Cerrada'}
      </h2>
      
      {currentSession ? (
        <div className="text-sm text-gray-600 mb-8 space-y-2">
          <p>Monto inicial: <span className="font-bold">{formatMoney(Number(currentSession.open_amount))}</span></p>
          <p>Abierta el: {new Date(currentSession.date_open).toLocaleString()}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
          Debes abrir la caja para poder registrar cobros y ventas en el sistema.
        </p>
      )}

      <Button 
        size="lg" 
        onClick={() => setIsModalOpen(true)}
        className="w-full max-w-xs flex items-center justify-center gap-2"
        variant={currentSession ? 'secondary' : 'primary'}
      >
        {currentSession ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
        {currentSession ? 'Cerrar Caja' : 'Abrir Caja'}
      </Button>

      {isModalOpen && (
        <CashModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          type={currentSession ? 'close' : 'open'}
        />
      )}
    </div>
  );
};
