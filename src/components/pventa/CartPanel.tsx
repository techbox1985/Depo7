import React from 'react';
import { useCartStore } from '../../store/useCartStore';
import QueuedSalesList from './QueuedSalesList';
import { formatMoney } from '../../utils/money';
import CartDiscountEditor from './CartDiscountEditor';

const CartPanel = ({
  setModalMode,
  setModalOpen,
  handleQueueSale,
  handleResumeSale,
  modalRef,
  selectedPriceList,
  selectedCustomer
}) => {
  const { items, subtotal, totalDiscount, total, removeItem, updateQuantity, updateItemDiscount } = useCartStore();
  return (
    <>
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="text-gray-400">Carrito vacío</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Producto</th>
                <th className="text-center p-2">Cant.</th>
                <th className="text-right p-2">Precio</th>
                <th className="text-center p-2">Desc.</th>
                <th className="text-right p-2">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.product?.id || idx} className="align-middle border-b last:border-b-0">
                  {/* Producto y nombre */}
                  <td className="p-2 max-w-30 truncate">
                    <div className="font-medium truncate">{item.product?.cod || '-'} {item.product?.name || '-'}</div>
                  </td>
                  {/* Cantidad */}
                  <td className="p-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button className="px-1 py-0.5 rounded bg-gray-200 hover:bg-gray-300" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                      <span className="min-w-4.5 text-center">{item.quantity}</span>
                      <button className="px-1 py-0.5 rounded bg-gray-200 hover:bg-gray-300" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  {/* Precio unitario */}
                  <td className="p-2 text-right whitespace-nowrap">{formatMoney(item.price)}</td>
                  {/* Editor de descuento compacto y label */}
                  <td className="p-2 text-center min-w-20">
                    <div className="flex flex-col items-center gap-0.5">
                      <CartDiscountEditor
                        discountType={item.discountType === 'percent' || item.discountType === 'amount' ? item.discountType : 'none'}
                        discountValue={item.discountValue || 0}
                        maxValue={item.price}
                        onChange={(type, value) => updateItemDiscount(item.product.id, type, value)}
                      />
                      {item.discountType !== 'none' && item.discountAmount > 0 && (
                        <span className="mt-0.5 px-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold tracking-tight border border-green-200">
                          {item.discountType === 'percent'
                            ? `-${item.discountValue}%`
                            : `-${formatMoney(item.discountAmount)}`}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Subtotal final */}
                  <td className="p-2 text-right font-bold whitespace-nowrap">
                    <span className="inline-block min-w-14 text-right">
                      {formatMoney(item.subtotal)}
                    </span>
                  </td>
                  {/* Eliminar */}
                  <td className="p-2 text-right">
                    <button className="text-red-500 hover:text-red-700 font-bold" onClick={() => removeItem(item.product.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Bloque resumen de importes */}
      <div className="mt-4 flex flex-col items-end text-right">
        <div className="text-sm text-gray-700 font-normal">
          Subtotal: <span className="font-semibold">{formatMoney(subtotal)}</span>
        </div>
        <div className="text-sm text-red-600 font-normal">
          Descuentos: <span className="font-semibold">-{formatMoney(totalDiscount)}</span>
        </div>
        <div className="mt-1 text-lg font-extrabold text-gray-900 tracking-tight">
          Total a pagar: <span className="text-green-700">{formatMoney(total)}</span>
        </div>
      </div>
      {/* Botones de acción final en una sola fila */}
      <div className="mt-6 flex flex-row gap-2 flex-wrap">
        <button
          className="flex-1 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 min-w-22.5"
          onClick={() => { setModalMode('cobrar'); setModalOpen(true); }}
        >
          Cobrar <span className="ml-1 text-xs font-normal align-middle">F2</span>
        </button>
        <button
          className="flex-1 py-2 rounded bg-gray-600 text-white font-bold hover:bg-gray-700 min-w-22.5"
          onClick={handleQueueSale}
        >
          En cola <span className="ml-1 text-xs font-normal align-middle">F3</span>
        </button>
        <button
          className="flex-1 py-2 rounded bg-yellow-500 text-white font-bold hover:bg-yellow-600 min-w-22.5"
          onClick={() => { setModalMode('pedido'); setModalOpen(true); }}
        >
          Pedido <span className="ml-1 text-xs font-normal align-middle">F4</span>
        </button>
      </div>
      <div className="mt-2">
        <button
          className="w-full py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700"
          onClick={() => { setModalMode('presupuesto'); setModalOpen(true); }}
        >
          Presupuestar <span className="ml-1 text-xs font-normal align-middle">F5</span>
        </button>
      </div>
      <QueuedSalesList onResume={handleResumeSale} />
      {/* Eliminado bloque debug última acción */}
    </>
  );
};

export default CartPanel;
