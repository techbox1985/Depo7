
import React, { useEffect, useState } from 'react';
import { useCashStore } from '../../store/useCashStore';
import { expensesService } from '../../services/expensesService';
import { formatMoney } from '../../utils/money';
import { ExpenseFormModal } from './ExpenseFormModal';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ExpensesPanel: React.FC = () => {
  const { currentSession } = useCashStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!currentSession?.id) {
        setExpenses([]);
        return;
      }
      setLoading(true);
      try {
        const data = await expensesService.getExpensesByCajaId(currentSession.id);
        setExpenses(data);
      } catch {
        setExpenses([]);
      }
      setLoading(false);
    };
    fetchExpenses();
    // Listen for external refresh
    const handler = () => fetchExpenses();
    window.addEventListener('expenses:refresh', handler);
    return () => window.removeEventListener('expenses:refresh', handler);
  }, [currentSession]);

  const handleSaveExpense = async ({ concept, description, amount }: { concept: string; description: string; amount: number }) => {
    if (!currentSession?.id) return;
    await expensesService.createExpense({ concept, description, amount, cash_closing_id: currentSession.id });
    setExpenseModalOpen(false);
    // Refresh
    const data = await expensesService.getExpensesByCajaId(currentSession.id);
    setExpenses(data);
    // Optionally, trigger global refresh
    window.dispatchEvent(new Event('expenses:refresh'));
  };

  if (!currentSession) {
    return (
      <div className="p-6 text-gray-500">No hay caja/turno abierto.</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Gastos de este turno</h2>
        <button
          className="px-4 py-2 rounded bg-green-600 text-white font-bold"
          onClick={() => setExpenseModalOpen(true)}
          disabled={!currentSession}
        >Cargar gasto</button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-4 text-gray-400">Cargando gastos...</div>
        ) : expenses.length === 0 ? (
          <div className="p-4 text-gray-500">No hay gastos registrados para este turno.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2">Detalle</th>
                <th className="text-right px-4 py-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((g) => (
                <tr key={g.id} className="border-t border-gray-100 hover:bg-indigo-50/30">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-semibold">{g.concept || '-'}</div>
                    <div className="text-xs text-gray-500">{g.description || '-'}</div>
                    <div className="text-xs text-gray-400">{formatDate(g.expense_date)}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-bold">{formatMoney(g.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />
    </div>
  );
};
