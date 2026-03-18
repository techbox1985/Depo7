import React, { useEffect, useMemo, useState } from 'react';
import { CartItem as CartItemType } from '../../types';
import { useCart } from '../../hooks/useCart';
import { Minus, Plus, Trash2, Tag, X } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

const SHW_LOGO_URL =
  'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg';

const normalizeDiscountType = (value?: string) => {
  if (value === 'percent' || value === 'porcentaje') return 'percent';
  if (value === 'amount' || value === 'fijo') return 'amount';
  return 'none';
};

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem, updateItemDiscount } = useCart();
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(item.discountValue?.toString() || '');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setDiscountInput(item.discountValue?.toString() || '');
  }, [item.discountValue]);

  const normalizedDiscountType = useMemo(
    () => normalizeDiscountType(item.discountType),
    [item.discountType]
  );

  const hasDiscount = normalizedDiscountType !== 'none' && Number(item.discountValue || 0) > 0;

  const originalLineTotal = Number((item.price * item.quantity).toFixed(2));
  const imageUrl = String(item.product.image_url || '').trim();
  const showPlaceholder = !imageUrl || imageError;

  const handleIncrease = () => {
    if (item.quantity < item.product.stock) {
      updateQuantity(item.product.id, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.product.id, item.quantity - 1);
    }
  };

  const applyDiscount = (type: 'percent' | 'amount') => {
    const val = parseFloat(discountInput);

    if (!isNaN(val) && val >= 0) {
      updateItemDiscount(item.product.id, type, val);
      setShowDiscount(false);
    }
  };

  const removeDiscount = () => {
    updateItemDiscount(item.product.id, 'none', 0);
    setDiscountInput('');
    setShowDiscount(false);
  };

  return (
    <li className="flex flex-col py-4">
      <div className="flex">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
          {showPlaceholder ? (
            <div className="flex h-full w-full items-center justify-center bg-white p-2">
              <img
                src={SHW_LOGO_URL}
                alt="SHW Distribuidora"
                className="h-full w-full object-contain opacity-25"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={item.product.name}
              className="h-full w-full object-cover object-center"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="ml-4 flex flex-1 flex-col">
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-900">
              <h3 className="line-clamp-1">{item.product.name}</h3>
              <div className="text-right">
                {hasDiscount && (
                  <p className="text-xs text-gray-400 line-through">${originalLineTotal.toFixed(2)}</p>
                )}
                <p className="ml-4">${item.subtotal.toFixed(2)}</p>
              </div>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {item.priceType === 'minorista' ? 'Minorista' : 'Mayorista'} • ${item.price.toFixed(2)} / c/u
            </p>

            {hasDiscount && (
              <p className="mt-0.5 text-xs text-green-600">
                Descuento:{' '}
                {normalizedDiscountType === 'percent'
                  ? `${item.discountValue}%`
                  : `$${Number(item.discountValue || 0).toFixed(2)}`}
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-1 items-end justify-between text-sm">
            <div className="flex items-center rounded-md border border-gray-300">
              <button
                type="button"
                onClick={handleDecrease}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </button>

              <span className="min-w-[2rem] px-2 py-1 text-center">{item.quantity}</span>

              <button
                type="button"
                onClick={handleIncrease}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={item.quantity >= item.product.stock}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDiscount(!showDiscount)}
                className={`font-medium ${
                  hasDiscount ? 'text-green-600 hover:text-green-500' : 'text-indigo-600 hover:text-indigo-500'
                }`}
                title="Aplicar descuento"
              >
                <Tag className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.product.id)}
                className="font-medium text-red-600 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDiscount && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            placeholder="Valor"
            className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />

          <button
            type="button"
            onClick={() => applyDiscount('percent')}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            %
          </button>

          <button
            type="button"
            onClick={() => applyDiscount('amount')}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            $
          </button>

          <div className="flex-1" />

          {hasDiscount && (
            <button
              type="button"
              onClick={removeDiscount}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Quitar descuento"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </li>
  );
};