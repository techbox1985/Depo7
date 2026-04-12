import React, { useEffect, useState } from 'react';
import { formatMoney } from '../../utils/money';
import { expensesService } from '../../services/expensesService';
import { ExpenseFormModal } from '../pventa/ExpenseFormModal';

// Helpers para tarjetas resumen
function sumBy(arr: any[], fn: (x: any) => number) {
  return arr.reduce((acc, x) => acc + (fn(x) || 0), 0);
}

export const ExpensesGeneralPanel: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Traer todos los gastos globales
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        let data = await expensesService.getAllExpenses();
        // Filtro por fechas si corresponde
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          data = data.filter((g: any) => g.expense_date && new Date(g.expense_date) >= fromDate);
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          // Incluir todo el día hasta las 23:59:59
          toDate.setHours(23,59,59,999);
          data = data.filter((g: any) => g.expense_date && new Date(g.expense_date) <= toDate);
        }
        setExpenses(data);
      } catch {
        setExpenses([]);
      }
      setLoading(false);
    };
    fetchExpenses();
    const handler = () => fetchExpenses();
    window.addEventListener('expenses:refresh', handler);
    return () => window.removeEventListener('expenses:refresh', handler);
  }, [dateFrom, dateTo]);

  const handleSaveExpense = async ({ concept, description, amount, payment_method }: { concept: string; description: string; amount: number; payment_method: string }) => {
    if (editingExpense) {
      await expensesService.updateExpense(editingExpense.id, { concept, description, amount, payment_method });
    } else {
      // Siempre crear como gasto general desde aquí
      await expensesService.createExpense({ concept, description, amount, payment_method, cash_closing_id: null, origin_type: 'general_negocio' });
    }
    setExpenseModalOpen(false);
    setEditingExpense(null);
    // Refrescar listado global
    const data = await expensesService.getAllExpenses();
    setExpenses(data);
    window.dispatchEvent(new Event('expenses:refresh'));
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar gasto?')) {
      await expensesService.deleteExpense(id);
      const data = await expensesService.getGeneralExpenses();
      setExpenses(data);
      window.dispatchEvent(new Event('expenses:refresh'));
    }
  };

  // --- Tarjetas resumen ---
  const totalGeneral = sumBy(expenses, (g) => g.amount);
  const totalPOS = sumBy(expenses, (g) => g.origin_type === 'pos_turno' ? g.amount : 0);
  const totalGenerales = sumBy(expenses, (g) => g.origin_type === 'general_negocio' ? g.amount : 0);
  const cantidadGastos = expenses.length;

  return (
    <div className="p-4 md:p-8 w-full max-w-[1800px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gastos globales del negocio</h1>

      {/* Tarjetas resumen grandes y alineadas, ocupando todo el ancho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full">
        <div className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-white p-8 shadow-sm w-full min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">Total general</div>
          <div className="text-5xl font-extrabold text-blue-900 mb-1">{formatMoney(totalGeneral)}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-purple-200 bg-white p-8 shadow-sm w-full min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-1">Total gastos POS</div>
          <div className="text-4xl font-bold text-purple-900 mb-1">{formatMoney(totalPOS)}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-white p-8 shadow-sm w-full min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-1">Total gastos generales</div>
          <div className="text-4xl font-bold text-green-900 mb-1">{formatMoney(totalGenerales)}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8 shadow-sm w-full min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Cantidad de gastos</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{cantidadGastos}</div>
        </div>
      </div>

      {/* Filtros debajo de tarjetas, bien alineados y ocupando toda la fila */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8 w-full flex flex-col md:flex-row md:items-end md:gap-6 gap-4">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-1 text-gray-700">Desde</label>
          <input type="date" className="border rounded px-3 py-3 text-base w-full" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-1 text-gray-700">Hasta</label>
          <input type="date" className="border rounded px-3 py-3 text-base w-full" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="flex flex-row gap-2 mt-4 md:mt-0">
          <button className="px-5 py-3 rounded bg-blue-600 text-white font-bold shadow-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpiar filtro</button>
          <button className="px-5 py-3 rounded bg-green-600 text-white font-bold shadow-sm" onClick={() => setExpenseModalOpen(true)}>Cargar gasto general</button>
        </div>
      </div>

      {/* Tabla de gastos amplia y alineada */}
      <div className="overflow-x-auto w-full">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm w-full min-w-[1100px]">
          {loading ? (
            <div className="p-8 text-gray-400">Cargando gastos...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-gray-500">No hay gastos registrados.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Concepto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Descripción</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Forma de pago</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Turno/Caja</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((g: any) => (
                  <tr key={g.id} className="border-t border-gray-100 hover:bg-indigo-50/30">
                    <td className="px-6 py-4 whitespace-nowrap">{g.expense_date ? new Date(g.expense_date).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={g.origin_type === 'pos_turno' ? 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs' : 'bg-green-100 text-green-700 px-2 py-1 rounded text-xs'}>
                        {g.origin_type === 'pos_turno' ? 'POS' : 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{g.concept || '-'}</td>
                    <td className="px-6 py-4">{g.description || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold">{formatMoney(g.amount)}</td>
                    <td className="px-6 py-4">{g.payment_method || '-'}</td>
                    <td className="px-6 py-4">
                      {g.cash_closing_id ? (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{g.cash_closing_id}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 mr-2" onClick={() => handleEdit(g)}>Editar</button>
                      <button className="text-red-600" onClick={() => handleDelete(g.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        mode="general"
      />
    </div>
  );
};
