import React, { useState } from 'react';
import { Cart } from './Cart';
import { DailySales } from './DailySales';
import { CashRegister } from './CashRegister';
import { ShoppingCart, History, Wallet } from 'lucide-react';
import { useCashStore } from '../../store/useCashStore';

export const POSSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cart' | 'history' | 'cash'>('cart');
  const { currentSession } = useCashStore();

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => setActiveTab('cart')} 
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'cart' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          <ShoppingCart className="h-4 w-4" /> Carrito
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          <History className="h-4 w-4" /> Ventas
        </button>
        <button 
          onClick={() => setActiveTab('cash')} 
          className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'cash' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        >
          <Wallet className="h-4 w-4" /> Caja
          {currentSession && <span className="w-2 h-2 rounded-full bg-green-500 absolute top-3 right-4"></span>}
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'cart' && <Cart />}
        {activeTab === 'history' && <DailySales />}
        {activeTab === 'cash' && <CashRegister />}
      </div>
    </div>
  );
};
