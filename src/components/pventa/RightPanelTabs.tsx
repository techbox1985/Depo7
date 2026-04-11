import React, { useState } from 'react';

import { ExpensesPanel } from './ExpensesPanel';

const RightPanelTabs = ({ CartPanel, SalesPanel, CashPanel }) => {
  const [tab, setTab] = useState('carrito');
  return (
    <div className="flex flex-col h-full">
      <div className="flex mb-2 border-b">
        <button className={`flex-1 py-2 ${tab === 'carrito' ? 'font-bold border-b-2 border-indigo-600' : ''}`} onClick={() => setTab('carrito')}>Carrito</button>
        <button className={`flex-1 py-2 ${tab === 'ventas' ? 'font-bold border-b-2 border-indigo-600' : ''}`} onClick={() => setTab('ventas')}>Ventas</button>
        <button className={`flex-1 py-2 ${tab === 'caja' ? 'font-bold border-b-2 border-indigo-600' : ''}`} onClick={() => setTab('caja')}>Caja</button>
        <button className={`flex-1 py-2 ${tab === 'gastos' ? 'font-bold border-b-2 border-indigo-600' : ''}`} onClick={() => setTab('gastos')}>Gastos</button>
      </div>
      <div className="flex-1 overflow-auto">
        {tab === 'carrito' && <CartPanel />}
        {tab === 'ventas' && <SalesPanel />}
        {tab === 'caja' && <CashPanel />}
        {tab === 'gastos' && <ExpensesPanel />}
      </div>
    </div>
  );
};

export default RightPanelTabs;
