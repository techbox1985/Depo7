import React from 'react';
import { useCartStore } from '../../store/useCartStore';
import QueuedSalesList from './QueuedSalesList';
import { formatMoney } from '../../utils/money';

const CartPanel = ({
  setModalMode,
  setModalOpen,
  handleQueueSale,
  handleResumeSale,
  modalRef,
  selectedPriceList,
  selectedCustomer
}) => {
  const { items, total, removeItem, updateQuantity } = useCartStore();
  return (
    <>
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="text-gray-400">Carrito vacío</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Producto</th>
                <th className="text-right p-2">Cant.</th>
                <th className="text-right p-2">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.product?.id || idx}>
                  <td className="p-2">{item.product?.cod || '-'} {item.product?.name || '-'}</td>
                  <td className="p-2 text-right">
                    <button className="px-2" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    {item.quantity}
                    <button className="px-2" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </td>
                  <td className="p-2 text-right">{formatMoney(item.price * item.quantity)}</td>
                  <td className="p-2 text-right">
                    <button className="text-red-500" onClick={() => removeItem(item.product.id)}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-4 font-bold text-right">
        Total: {formatMoney(total)}
      </div>
      {/* Botones de acción final en una sola fila */}
      <div className="mt-6 flex flex-row gap-2 flex-wrap">
        <button
          className="flex-1 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 min-w-[90px]"
          onClick={() => { setModalMode('cobrar'); setModalOpen(true); }}
        >
          Cobrar <span className="ml-1 text-xs font-normal align-middle">F2</span>
        </button>
        <button
          className="flex-1 py-2 rounded bg-gray-600 text-white font-bold hover:bg-gray-700 min-w-[90px]"
          onClick={handleQueueSale}
        >
          En cola <span className="ml-1 text-xs font-normal align-middle">F3</span>
        </button>
        <button
          className="flex-1 py-2 rounded bg-yellow-500 text-white font-bold hover:bg-yellow-600 min-w-[90px]"
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
