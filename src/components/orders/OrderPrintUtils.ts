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
  // Implementación mínima o importar de PVenta si se unifica
  return `<html><body><h1>Comprobante</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
}
