import React, { useEffect, useState } from 'react';
import { useCashStore } from '../../store/useCashStore';
import { formatMoney } from '../../utils/money';
import { supabase } from '../../services/supabaseClient';
import { expensesService } from '../../services/expensesService';

const CashPanel = () => {
  const { currentSession, closeSession, fetchCurrentSession } = useCashStore();
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Refrescar ventas y gastos al cambiar caja
  useEffect(() => {
    const fetchData = async () => {
      if (!currentSession?.id) {
        setSales([]);
        setExpenses([]);
        return;
      }
      setLoading(true);
      // Ventas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('caja_id', currentSession.id)
        .not('estado', 'eq', 'cancelada');
      setSales(salesError ? [] : salesData || []);
      // Gastos
      try {
        const gastos = await expensesService.getExpensesByCajaId(currentSession.id);
        setExpenses(gastos);
      } catch {
        setExpenses([]);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [currentSession]);

  if (!currentSession) {
    return (
      <div className="p-2">
        <h3 className="font-bold mb-2">Caja actual</h3>
        <div className="text-gray-500">No hay caja abierta.</div>
      </div>
    );
  }

  // Cálculos reales
  let totalVendido = 0;
  let totalEfectivo = 0;
  let totalDigital = 0;
  let cantidadVentas = 0;
  sales.forEach(sale => {
    totalVendido += Number(sale.total || 0);
    totalEfectivo += Number(sale.monto_efectivo || 0);
    totalDigital += Number(sale.monto_digital || 0);
    cantidadVentas += 1;
  });
  // Gastos: si no hay gastos reales, dejarlo claro
  let totalGastos = 0;
  let gastosMsg = '';
  if (expenses.length > 0) {
    totalGastos = expenses.reduce((sum, g) => sum + Number(g.monto || 0), 0);
  } else {
    gastosMsg = 'No hay gastos registrados para este turno.';
  }
  const saldo = currentSession.open_amount + totalEfectivo + totalDigital - totalGastos;

  return (
    <div className="p-2">
      <h3 className="font-bold mb-2">Caja actual</h3>
      <div className="mb-2">Apertura: {currentSession.date_open ? new Date(currentSession.date_open).toLocaleString() : '-'}</div>
      <div className="mb-2">Cantidad de ventas: <b>{cantidadVentas}</b></div>
      <div className="mb-2">Total vendido: <b>{formatMoney(totalVendido)}</b></div>
      <div className="mb-2">Efectivo: <b>{formatMoney(totalEfectivo)}</b></div>
      <div className="mb-2">Digital: <b>{formatMoney(totalDigital)}</b></div>
      <div className="mb-2">Gastos: <b>{formatMoney(totalGastos)}</b> {gastosMsg && <span className="text-xs text-gray-500">({gastosMsg})</span>}</div>
      <div className="mb-2">Saldo: <b>{formatMoney(saldo)}</b></div>
      <div className="mb-2">Estado: <b>{currentSession.status}</b></div>
      <button
        className="mt-4 px-4 py-2 rounded bg-red-600 text-white font-bold"
        onClick={async () => {
          await closeSession(currentSession.close_amount ?? 0, {});
          await fetchCurrentSession();
        }}
      >Cerrar caja</button>
      {loading && <div className="text-xs text-gray-400 mt-2">Actualizando datos...</div>}
    </div>
  );
};
export default CashPanel;
