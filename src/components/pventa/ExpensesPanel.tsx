import React, { useEffect, useState } from 'react';
import { expensesService } from '../../services/expensesService';
import { formatMoney } from '../../utils/money';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ExpensesPanel: React.FC = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
    const [usuario, setUsuario] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const data = await expensesService.getAllExpenses();
        setExpenses(data);
      } catch {
        setExpenses([]);
      }
      setLoading(false);
    };
    fetchExpenses();
    // Suscribirse a evento global para refresh externo
    const handler = () => fetchExpenses();
    window.addEventListener('expenses:refresh', handler);
    return () => window.removeEventListener('expenses:refresh', handler);
  }, []);

  // Filtros reactivos
  useEffect(() => {
    let f = [...expenses];
    if (dateFrom) {
      const from = new Date(dateFrom);
      f = f.filter(e => new Date(e.expense_date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23,59,59,999);
      f = f.filter(e => new Date(e.expense_date) <= to);
    }
    if (usuario) {
      f = f.filter(e => String(e.user_id) === usuario);
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(e => (e.concept || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q));
    }
    setFiltered(f);
  }, [expenses, dateFrom, dateTo, search, usuario]);

  // Obtener cajas únicas para filtro
    const usuarios = Array.from(new Set(expenses.map(e => e.user_id).filter(Boolean)));

  // Resúmenes
  const totalVisible = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const cantidadVisible = filtered.length;
    const totalPorUsuario = usuario ? filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0) : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gastos del negocio</h1>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs text-gray-500">Total de gastos visibles</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{formatMoney(totalVisible)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs text-gray-500">Cantidad de gastos</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{cantidadVisible}</div>
        </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">Total por usuario</div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">{usuario ? formatMoney(totalPorUsuario) : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-xs text-gray-500">Rango de fechas</div>
          <div className="text-md font-semibold text-gray-700 mt-1">{dateFrom || '...'} - {dateTo || '...'}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">Fecha desde</label>
          <input type="date" className="border rounded px-2 py-1 w-full" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Fecha hasta</label>
          <input type="date" className="border rounded px-2 py-1 w-full" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Usuario</label>
            <select className="border rounded px-2 py-1 w-full" value={usuario} onChange={e => setUsuario(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1">Buscar concepto o descripción</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." />
        </div>
      </div>

      {/* Tabla de gastos */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-4 text-gray-400">Cargando gastos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-gray-500">No hay gastos registrados.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-left px-4 py-2">Concepto</th>
                <th className="text-left px-4 py-2">Descripción</th>
                <th className="text-right px-4 py-2">Monto</th>
                <th className="text-left px-4 py-2">Caja/Turno</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} className="border-t border-gray-100 hover:bg-indigo-50/30">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(g.expense_date)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{g.concept || '-'}</td>
                  <td className="px-4 py-2">{g.description || '-'}</td>
                  <td className="px-4 py-2 text-right font-bold">{formatMoney(g.amount)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{g.cash_closing_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
