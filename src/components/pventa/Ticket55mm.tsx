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
  total: number;
  generalDiscount?: number;
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
  total,
  generalDiscount,
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
              <td style={{ textAlign: 'right' }}>{Math.round(p.unitPrice)}</td>
              <td style={{ textAlign: 'right' }}>{Math.round(p.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, marginTop: 6, textAlign: 'right' }}>
        <div>Subtotal: {Math.round(products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}</div>
        <div>Descuento: -{Math.round(products.reduce((sum, p) => sum + (p.discount ?? 0), 0))}</div>
        <div style={{ color: '#15803d', fontWeight: 'bold' }}>Ahorraste: {Math.round(products.reduce((sum, p) => sum + (p.discount ?? 0), 0))}</div>
        <div style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Total: {Math.round(total)}</div>
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
