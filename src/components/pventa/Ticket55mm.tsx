import React from 'react';

/**
 * Props para el Ticket 55mm reutilizable
 */
export interface Ticket55mmProps {
  logoUrl: string;
  companyName: string;
  companyAddress: string;
  companyCUIT?: string;
  companyPhone?: string;
  date: string; // Formato legible
  saleCode: string;
  clientName?: string;
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discount?: number;
  }>;
  subtotal: number;
  itemDiscount: number;
  generalDiscount?: number;
  ahorroTotal: number;
  total: number;
  paymentBreakdown: Array<{
    type: 'efectivo' | 'digital';
    method?: 'mercadopago' | 'transferencia' | 'tarjeta';
    amount: number;
    installments?: number;
  }>;
  cashier?: string;
  turno?: string;
  footerMessage?: string;
}

/**
 * Componente reutilizable para impresión de ticket comercial 55mm 
 */
export const Ticket55mm: React.FC<Ticket55mmProps> = ({
  logoUrl,
  companyName,
  companyAddress,
  companyCUIT,
  companyPhone,
  date,
  saleCode,
  clientName,
  products,
  subtotal,
  itemDiscount,
  generalDiscount,
  ahorroTotal,
  total,
  paymentBreakdown,
  cashier,
  turno,
  footerMessage = '¡Gracias por su compra!'
}) => {
  // Ensure logo is absolute URL for printing
  let resolvedLogoUrl = logoUrl;
  if (logoUrl && !/^https?:\/\//.test(logoUrl) && !logoUrl.startsWith('data:')) {
    resolvedLogoUrl = window.location.origin + (logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl);
  }
  return (
    <div style={{ width: '55mm', fontFamily: 'monospace', fontSize: 12, padding: 0, margin: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        {resolvedLogoUrl && (
          <img
            src={resolvedLogoUrl}
            alt="logo"
            style={{ width: '38mm', height: '38mm', objectFit: 'contain', display: 'block', margin: '0 auto', imageRendering: 'auto' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{ fontWeight: 'bold', fontSize: 14 }}>{companyName}</div>
        <div>{companyAddress}</div>
        {companyCUIT && <div>CUIT: {companyCUIT}</div>}
        {companyPhone && <div>Tel: {companyPhone}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ fontSize: 11 }}>
        <div>Fecha: {date}</div>
        <div>Venta: {saleCode}</div>
        {clientName && <div>Cliente: {clientName}</div>}
        {turno && <div>Turno: {turno}</div>}
        {cashier && <div>Cajero: {cashier}</div>}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <table style={{ width: '100%', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Cant</th>
            <th style={{ textAlign: 'left' }}>Producto</th>
            <th style={{ textAlign: 'right' }}>P.U.</th>
            <th style={{ textAlign: 'right' }}>Subt.</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx}>
              <td>{p.quantity}</td>
              <td>{p.name}</td>
              <td style={{ textAlign: 'right' }}>{Math.round(p.price ?? p.unitPrice)}</td>
              <td style={{ textAlign: 'right' }}>{Math.round(p.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, marginTop: 6, textAlign: 'right' }}>
        {(() => {
          // Inspección directa del shape real de los items
          // console.log('Ticket items:', products);
          // Subtotal bruto: suma de price * quantity (price es el precio unitario bruto)
          const subtotalBruto = products.reduce((sum, p) => sum + (Number(p.price ?? p.unitPrice) * Number(p.quantity)), 0);
          // Subtotal neto: si existe p.subtotal, usarlo; si no, calcular price * quantity - (discount)
          const subtotalNeto = products.reduce((sum, p) => {
            if (typeof p.subtotal === 'number' && !isNaN(p.subtotal)) return sum + p.subtotal;
            // reconstruir si falta
            const unit = Number(p.price ?? p.unitPrice);
            const qty = Number(p.quantity);
            const desc = Number(p.discountAmount ?? p.discount ?? 0);
            return sum + (unit * qty - desc);
          }, 0);
          // Descuento por ítems: diferencia entre bruto y neto
          const descuentoPorItems = subtotalBruto - subtotalNeto;
          // Descuento general: prop, seguro
          const safeGeneralDiscount = Number.isFinite(Number(generalDiscount)) ? Number(generalDiscount) : 0;
          // Ahorraste: suma de ambos
          const ahorroTotal = descuentoPorItems + safeGeneralDiscount;
          // Total: prop, o bruto - ahorro
          const safeTotal = Number.isFinite(Number(total)) ? Number(total) : subtotalBruto - ahorroTotal;
          return <>
            <div>Subtotal: {Math.round(subtotalBruto)}</div>
            <div>Descuento por ítems: -{Math.round(descuentoPorItems)}</div>
            {safeGeneralDiscount > 0 && (
              <div>Descuento general: -{Math.round(safeGeneralDiscount)}</div>
            )}
            <div style={{ color: '#15803d', fontWeight: 'bold' }}>Ahorraste: {Math.round(ahorroTotal)}</div>
            <div style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Total: {Math.round(safeTotal)}</div>
          </>;
        })()}
      </div>
      <div style={{ fontSize: 11, marginTop: 2 }}>
        <div>Pago:</div>
        {paymentBreakdown.map((p, idx) => (
          <div key={idx}>
            {p.type === 'efectivo' && <>Efectivo: {p.amount.toFixed(2)}</>}
            {p.type === 'digital' && <>
              Digital: {p.amount.toFixed(2)}
              {p.method && <> ({p.method})</>}
              {p.installments && <> - {p.installments} cuotas</>}
            </>}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ textAlign: 'center', fontSize: 11, marginTop: 4 }}>{footerMessage}</div>
    </div>
  );
};
