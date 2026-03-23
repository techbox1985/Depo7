import React, { useEffect, useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useCashStore } from '../../store/useCashStore';
import { CartItem } from './CartItem';
import { Button } from '../ui/Button';
import {
  ShoppingBag,
  CreditCard,
  AlertCircle,
  FileText,
  Clock,
  List,
  Printer,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useProductsStore } from '../../store/useProductsStore';
import { usePromotionsStore } from '../../store/usePromotionsStore';
import { CobroModal } from './CobroModal';
import { formatMoney, roundMoney } from '../../utils/money';

type ModalStatus = string;
type SaleDiscountType = 'ninguno' | 'porcentaje' | 'fijo';
type GlobalPriceList = 'lista_1' | 'lista_2' | 'lista_3';

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
  status: ModalStatus;
  customerId?: string;
  items: CartSnapshotItem[];
  subtotal: number;
  total: number;
  createdAt: string;
};

const getDocumentTitle = (status: ModalStatus) => {
  if (status === 'completada') return 'Ticket de Venta';
  if (status === 'presupuesto') return 'Presupuesto';
  return 'Pedido';
};

const getPrintConfig = (status: ModalStatus) => {
  if (status === 'completada') {
    return {
      pageSize: '55mm auto',
      width: '55mm',
      title: 'Ticket de Venta',
    };
  }

  if (status === 'presupuesto') {
    return {
      pageSize: 'A4',
      width: '210mm',
      title: 'Presupuesto',
    };
  }

  return {
    pageSize: 'A5',
    width: '148mm',
    title: 'Pedido',
  };
};

const buildWhatsAppText = (data: PostActionData) => {
  const header =
    data.status === 'completada'
      ? 'VENTA'
      : data.status === 'presupuesto'
        ? 'PRESUPUESTO'
        : 'PEDIDO';

  const lines = data.items.map(
    (item) =>
      `• ${item.productName} x${item.quantity} - ${formatMoney(item.unitPrice)} c/u = ${formatMoney(item.subtotal)}`
  );

  return [
    `*${header}*`,
    `Fecha: ${new Date(data.createdAt).toLocaleString('es-AR')}`,
    '',
    ...lines,
    '',
    `Subtotal: ${formatMoney(data.subtotal)}`,
    `Total: *${formatMoney(data.total)}*`,
  ].join('\n');
};

export const buildPrintHtml = (data: PostActionData) => {
  const config = getPrintConfig(data.status);
  const title = getDocumentTitle(data.status);

  const rows = data.items
    .map((item) => {
      // El descuento total de la línea es la diferencia entre el precio base original y lo que se paga finalmente
      const lineOriginalTotal = roundMoney(item.originalUnitPrice * item.quantity);
      const lineDiscount = roundMoney(lineOriginalTotal - item.subtotal);
      const unitDiscount = roundMoney(lineDiscount / item.quantity);
      
      return `
        <tr>
          <td>${item.productName}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">${formatMoney(item.originalUnitPrice)}</td>
          <td style="text-align:right;">${formatMoney(item.unitPrice)}</td>
          <td style="text-align:right;">${unitDiscount > 0.01 ? formatMoney(unitDiscount) : '-'}</td>
          <td style="text-align:right;">${formatMoney(item.subtotal)}</td>
        </tr>
      `;
    })
    .join('');

  const grossSubtotal = data.items.reduce(
    (acc, item) => acc + item.originalUnitPrice * item.quantity,
    0
  );
  const totalFinal = data.items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalDiscount = grossSubtotal - totalFinal;

  const compact = data.status === 'completada';

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${config.pageSize};
            margin: ${compact ? '4mm' : '10mm'};
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          .page {
            width: ${config.width};
            margin: 0 auto;
            padding: ${compact ? '2mm' : '8mm'};
            box-sizing: border-box;
          }

          .header {
            text-align: center;
            margin-bottom: ${compact ? '8px' : '18px'};
          }

          .brand {
            font-size: ${compact ? '16px' : '22px'};
            font-weight: 700;
            letter-spacing: 0.03em;
            margin-bottom: 4px;
          }

          .subtitle {
            font-size: ${compact ? '10px' : '13px'};
            color: #4b5563;
          }

          .meta {
            font-size: ${compact ? '10px' : '12px'};
            margin-bottom: ${compact ? '8px' : '14px'};
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 12px;
          }

          th, td {
            border-bottom: 1px solid #e5e7eb;
            padding: ${compact ? '4px 2px' : '8px 4px'};
            font-size: ${compact ? '10px' : '12px'};
            vertical-align: top;
          }

          th {
            text-align: left;
            color: #374151;
          }

          .totals {
            margin-top: 10px;
            border-top: 1px solid #111827;
            padding-top: 8px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: ${compact ? '11px' : '14px'};
            margin-bottom: 4px;
          }

          .total-final {
            font-weight: 700;
            font-size: ${compact ? '13px' : '18px'};
          }

          .footer {
            margin-top: ${compact ? '10px' : '18px'};
            text-align: center;
            font-size: ${compact ? '10px' : '12px'};
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">SHW Distribuidora</div>
            <div class="subtitle">${title}</div>
          </div>

          <div class="meta">
            <div><strong>Fecha:</strong> ${new Date(data.createdAt).toLocaleString('es-AR')}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Original</th>
                <th style="text-align:right;">Final</th>
                <th style="text-align:right;">Desc.</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatMoney(grossSubtotal)}</span>
            </div>
            <div class="total-row">
              <span>Descuento Total</span>
              <span style="color:green;">-${formatMoney(totalDiscount)}</span>
            </div>
            <div class="total-row total-final">
              <span>Total</span>
              <span>${formatMoney(totalFinal)}</span>
            </div>
          </div>

          <div class="footer">
            Gracias por operar con SHW Distribuidora
          </div>
        </div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
};

const PostActionModal: React.FC<{
  data: PostActionData | null;
  onClose: () => void;
}> = ({ data, onClose }) => {
  if (!data) return null;

  const title =
    data.status === 'completada'
      ? 'Venta registrada'
      : data.status === 'presupuesto'
        ? 'Presupuesto generado'
        : 'Pedido registrado';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(data));
    printWindow.document.close();
  };

  const handleWhatsApp = () => {
    const text = buildWhatsAppText(data);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Elegí qué querés hacer ahora con el comprobante.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.status === 'completada' && (
              <>
                <Button
                  type="button"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir ticket
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </>
            )}

            {data.status === 'presupuesto' && (
              <>
                <Button
                  type="button"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir presupuesto
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex w-full items-center justify-center gap-2"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </>
            )}

            {data.status === 'pendiente' && (
              <Button
                type="button"
                className="flex w-full items-center justify-center gap-2"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </Button>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Cart: React.FC = () => {
  const {
    items,
    subtotal,
    totalDiscount,
    total,
    globalPriceList,
    setGlobalPriceList,
    clearCart,
    checkout,
    isProcessing,
    error,
    updateQuantity,
    removeItem,
  } = useCart();

  const { currentSession } = useCashStore();
  const { fetchProducts } = useProductsStore();
  const { promotions } = usePromotionsStore();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>('completada');
  const [postActionData, setPostActionData] = useState<PostActionData | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemId(null);
    } else if (!selectedItemId || !items.find((i) => i.product.id === selectedItemId)) {
      setSelectedItemId(items[0].product.id);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (items.length > 0 && !isProcessing) {
          handleOpenModal('completada');
        }
      } else if (e.key === 'Escape') {
        if (isModalOpen) {
          e.preventDefault();
          setIsModalOpen(false);
        }
      } else if (selectedItemId) {
        const item = items.find((i) => i.product.id === selectedItemId);
        if (!item) return;

        if (e.key === '+') {
          e.preventDefault();
          updateQuantity(item.product.id, item.quantity + 1, promotions);
        } else if (e.key === '-') {
          e.preventDefault();
          if (item.quantity > 1) updateQuantity(item.product.id, item.quantity - 1, promotions);
        } else if (e.key === 'Delete') {
          e.preventDefault();
          removeItem(item.product.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isProcessing, isModalOpen, selectedItemId, updateQuantity, removeItem]);

  const handleOpenModal = (status: ModalStatus) => {
    if (!currentSession) {
      setLocalError('Debes abrir la caja antes de poder operar.');
      setTimeout(() => setLocalError(null), 3000);
      return;
    }

    setLocalError(null);
    setModalStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmCheckout = async (
    customerId: string | undefined,
    options: {
      discountType: SaleDiscountType;
      discountValue: number;
      priceList: GlobalPriceList;
      paymentMethod: 'efectivo' | 'digital' | 'mixto';
      digitalType?: 'mercadopago' | 'transferencia' | 'tarjeta';
      installments?: number;
      amountCash?: number;
      amountDigital?: number;
    }
  ) => {
    try {
      setLocalError(null);

      const checkoutPayload = await checkout(customerId, modalStatus, options, currentSession?.id);

      const messages: Record<ModalStatus, string> = {
        completada: '¡Venta completada con éxito!',
        pendiente: '¡Pedido registrado con éxito!',
        presupuesto: '¡Presupuesto creado con éxito!',
      };

      if (checkoutPayload && checkoutPayload.success) {
        const isOffline = checkoutPayload.data?.offline;
        const correctedItems = checkoutPayload.printItems || [];

        const grossSubtotal = correctedItems.reduce(
          (acc, item) => acc + item.originalUnitPrice * item.quantity,
          0
        );

        const totalFinal = correctedItems.reduce(
          (acc, item) => acc + item.subtotal,
          0
        );

        const snapshotAfterCheckout: PostActionData = {
          status: modalStatus,
          customerId,
          items: correctedItems,
          subtotal: grossSubtotal,
          total: totalFinal,
          createdAt: new Date().toISOString(),
        };
        setPostActionData(snapshotAfterCheckout);
        
        if (isOffline) {
          setSuccessMessage('Operación guardada localmente (Sin conexión)');
        } else {
          setSuccessMessage(messages[modalStatus]);
        }
      }

      if (modalStatus === 'completada' && !checkoutPayload?.data?.offline) {
        await fetchProducts();
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error al procesar operación del carrito:', err);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col bg-white">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Tu carrito está vacío</h3>
            <p className="mt-1 text-sm text-gray-500">Agregá algunos productos para comenzar.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-medium text-gray-900">Pedido Actual</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Vaciar
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                <List className="h-4 w-4 text-gray-500" />
                <select
                  value={globalPriceList}
                  onChange={(e) => setGlobalPriceList(e.target.value as GlobalPriceList, promotions)}
                  className="block w-full border-none bg-transparent py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="lista_1">Lista 1</option>
                  <option value="lista_2">Lista 2</option>
                  <option value="lista_3">Lista 3</option>
                </select>
              </div>

              <div className="mt-6">
                <div className="flow-root">
                  <ul role="list" className="-my-6 divide-y divide-gray-200">
                    {items.map((item) => (
                      <CartItem
                        key={`${item.product.id}-${item.priceType}`}
                        item={item}
                        isSelected={selectedItemId === item.product.id}
                        onSelect={() => setSelectedItemId(item.product.id)}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
              {(error || localError) && (
                <div className="mb-4 flex items-start rounded-md bg-red-50 p-3">
                  <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-700">{error || localError}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 rounded-md bg-green-50 p-3">
                  <p className="text-center text-sm font-medium text-green-700">{successMessage}</p>
                </div>
              )}

              <div className="mb-2 flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>{formatMoney(subtotal)}</p>
              </div>

              {totalDiscount > 0 && (
                <div className="mb-2 flex justify-between text-base font-medium text-green-600">
                  <p>Descuento</p>
                  <p>-{formatMoney(totalDiscount)}</p>
                </div>
              )}

              <div className="mb-6 flex justify-between text-lg font-bold text-gray-900">
                <p>Total</p>
                <p>{formatMoney(total)}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  type="button"
                  className="flex w-full items-center justify-center"
                  size="lg"
                  onClick={() => handleOpenModal('completada')}
                  isLoading={isProcessing}
                  disabled={items.length === 0}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Cobrar
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex w-full items-center justify-center"
                    onClick={() => handleOpenModal('pendiente')}
                    disabled={isProcessing || items.length === 0}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Pedido
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="flex w-full items-center justify-center"
                    onClick={() => handleOpenModal('presupuesto')}
                    disabled={isProcessing || items.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Presupuesto
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {isModalOpen && (
          <CobroModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            status={modalStatus}
            onConfirm={handleConfirmCheckout}
          />
        )}
      </div>

      <PostActionModal
        data={postActionData}
        onClose={() => setPostActionData(null)}
      />
    </>
  );
};

export default Cart;