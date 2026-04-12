import React, { useEffect, useState, useRef } from 'react';
import { useCashStore } from '../../store/useCashStore';
import { formatMoney } from '../../utils/money';
import { supabase } from '../../services/supabaseClient';
import { expensesService } from '../../services/expensesService';
import { ExpenseFormModal } from './ExpenseFormModal';
import { TicketCierreCaja } from './TicketCierreCaja';

const CashPanel = () => {
  const { currentSession, closeSession, fetchCurrentSession } = useCashStore();
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [showCierreTicket, setShowCierreTicket] = useState(false);
  const cierreTicketRef = useRef<HTMLDivElement>(null);

  // Refrescar ventas y gastos al cambiar caja
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

  useEffect(() => {
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
  // Gastos: solo sumar los del turno actual y concept === 'POS'
  let totalGastos = 0;
  let gastosMsg = '';
  const gastosTurno = expenses.filter(g => g.concept === 'POS');
  if (gastosTurno.length > 0) {
    totalGastos = gastosTurno.reduce((sum, g) => sum + Number(g.amount || 0), 0);
  } else {
    gastosMsg = 'No hay gastos registrados para este turno.';
  }
  // Saldo: apertura + efectivo + digital - gastos reales
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
      {/* Botón de cargar gasto movido a ExpensesPanel */}
      <button
        className="mt-4 px-4 py-2 rounded bg-red-600 text-white font-bold"
        onClick={async () => {
          // Cierre real de caja
          await closeSession(saldo, {
            total_sales: totalVendido,
            cantidad_ventas: cantidadVentas,
            cobrado_efectivo: totalEfectivo,
            cobrado_digital: totalDigital,
            gastos: expenses,
            saldo_final: saldo,
          });
          await fetchCurrentSession();
          setShowCierreTicket(true);
        }}
      >Cerrar caja</button>
      {loading && <div className="text-xs text-gray-400 mt-2">Actualizando datos...</div>}

      {/* Modal de ticket de cierre */}
      {showCierreTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-4 w-[340px]">
            <div ref={cierreTicketRef}>
              <TicketCierreCaja cierre={{
                ...currentSession,
                close_amount: saldo,
                date_close: new Date().toISOString(),
              }} ventas={sales} gastos={expenses} />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="px-3 py-1" onClick={() => setShowCierreTicket(false)}>Cerrar</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => {
                if (cierreTicketRef.current) {
                  const printContents = cierreTicketRef.current.innerHTML;
                  const win = window.open('', '', 'width=340,height=600');
                  win.document.write('<html><head><title>Ticket de cierre</title></head><body>' + printContents + '</body></html>');
                  win.document.close();
                  win.focus();
                  setTimeout(() => {
                    win.print();
                    win.close();
                  }, 300);
                }
              }}>Imprimir ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CashPanel;
