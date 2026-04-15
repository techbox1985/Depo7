import React from 'react';
import { useCashStore } from '../../store/useCashStore';
import { formatMoney } from '../../utils/money';

export const TicketCierreCaja = ({ cierre, ventas, gastos }) => {
  if (!cierre) return null;
  return (
    <div style={{ width: 300, fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <img src="/logo.png" alt="logo" style={{ maxWidth: 80, margin: '0 auto' }} />
        <div><b>Depo7</b></div>
        <div>CUIT: 30-00000000-0</div>
        <div>Av. Ejemplo 123</div>
      </div>
      <div><b>CIERRE DE CAJA</b></div>
      <div>Caja/Turno: {cierre.id}</div>
      <div>Apertura: {cierre.date_open ? new Date(cierre.date_open).toLocaleString() : '-'}</div>
      <div>Cierre: {cierre.date_close ? new Date(cierre.date_close).toLocaleString() : '-'}</div>
      <div>------------------------------------</div>
      <div>Ventas: <b>{ventas.length}</b></div>
      <div>Total vendido: <b>{formatMoney(ventas.reduce((sum, v) => sum + Number(v.total || 0), 0))}</b></div>
      <div>Efectivo: <b>{formatMoney(ventas.reduce((sum, v) => sum + Number(v.monto_efectivo || 0), 0))}</b></div>
      <div>Digital: <b>{formatMoney(ventas.reduce((sum, v) => sum + Number(v.monto_digital || 0), 0))}</b></div>
      <div>------------------------------------</div>
      <div><b>Gastos del turno</b></div>
      {gastos.length === 0 && <div>No hay gastos.</div>}
      {gastos.map(g => (
        <div key={g.id}>
          {g.descripcion} - {formatMoney(g.monto)}
        </div>
      ))}
      <div>------------------------------------</div>
      <div>Saldo final: <b>{formatMoney(cierre.close_amount || 0)}</b></div>
      <div style={{ marginTop: 10, textAlign: 'center' }}>¡Gracias por su trabajo!</div>
    </div>
  );
};
