// Copia mínima de Cart para impresión y datos de OrdersView
export type CartSnapshotItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  discountAmount: number;
  subtotal: number;
};

export type PostActionData = {
  status: string;
  customerId?: string;
  items: CartSnapshotItem[];
  subtotal: number;
  total: number;
  createdAt: string;
};

export function buildPrintHtml(data: PostActionData) {
  // Plantilla profesional A5 para impresión de tickets
  const { items, total, subtotal, createdAt, status, customerId } = data;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #fff; }
    .ticket-container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 24px; }
    h1 { text-align: center; font-size: 2rem; margin-bottom: 0.5em; }
    .info { margin-bottom: 1.5em; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 0.3em; }
    .products { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; }
    .products th, .products td { border: 1px solid #eee; padding: 8px; text-align: left; }
    .products th { background: #f5f5f5; }
    .totals { text-align: right; margin-top: 1em; }
    .totals strong { font-size: 1.2em; }
    .footer { text-align: center; color: #888; margin-top: 2em; font-size: 0.9em; }
  </style>
</head>
<body onload="window.print()">
  <div class="ticket-container">
    <h1>Comprobante</h1>
    <div class="info">
      <div class="info-row"><span><strong>Fecha:</strong> ${new Date(createdAt).toLocaleString('es-AR')}</span><span><strong>Estado:</strong> ${status}</span></div>
      <div class="info-row"><span><strong>Cliente:</strong> ${customerId || 'Consumidor Final'}</span></div>
    </div>
    <table class="products">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio Unitario</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>$${item.unitPrice.toLocaleString('es-AR')}</td>
            <td>$${item.subtotal.toLocaleString('es-AR')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div><strong>Subtotal:</strong> $${subtotal.toLocaleString('es-AR')}</div>
      <div><strong>Total:</strong> $${total.toLocaleString('es-AR')}</div>
    </div>
    <div class="footer">Gracias por su compra</div>
  </div>
</body>
</html>`;
}
