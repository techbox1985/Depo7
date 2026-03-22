import React, { useMemo, useState, useEffect } from 'react';
import { Product, PriceList } from '../../types';
import { useCart } from '../../hooks/useCart';
import { Button } from '../ui/Button';
import { Plus, AlertCircle, History } from 'lucide-react';
import { getEffectivePrice, getBasePrice, getActivePromotion } from '../../utils/priceUtils';
import { usePromotions } from '../../hooks/usePromotions';
import { formatMoney } from '../../utils/money';
import { getFractionalLabel } from '../../utils/stockUtils';
import { priceListsService } from '../../services/priceListsService';

interface ProductCardProps {
  product: Product;
  onViewHistory?: (product: Product) => void;
}

const SHW_LOGO_URL =
  'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg';

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onViewHistory }) => {
  console.log('ProductCard - product:', product);
  const { addItem } = useCart();
  const { promotions } = usePromotions();
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedPriceListCode, setSelectedPriceListCode] = useState<string>('lista_1');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    priceListsService.getPriceLists().then(setPriceLists).catch(console.error);
  }, []);

  const imageUrl = useMemo(() => {
    const raw = String(product.image_url || '').trim();
    return raw.length > 0 ? raw : '';
  }, [product.image_url]);

  const showPlaceholder = !imageUrl || imageError;

  const basePrice = getBasePrice(product, selectedPriceListCode as any);
  const effectivePrice = getEffectivePrice(product, selectedPriceListCode as any, promotions);
  const activePromo = getActivePromotion(product, promotions);
  
  // Debug
  if (!product.product_prices || product.product_prices.length === 0) {
    console.error('ProductCard - product_prices missing for product:', product.id, product.name);
  }

  const hasDiscount = effectivePrice < (basePrice || 0);
  const isOutOfStock = Number(product.stock || 0) <= 0;
  const isInactive = product.estado === 'inactivo' || product.estado === 'inactive';

  const fractionalLabel = useMemo(() => getFractionalLabel(product), [product]);

  const handleAddToCart = () => {
    if (!isOutOfStock && !isInactive) {
      addItem(product, selectedPriceListCode as any, 1);
    }
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        isInactive ? 'border-red-200 bg-red-50 opacity-75' : 'border-gray-200 bg-white'
      }`}
    >
      {isInactive && (
        <div className="absolute right-2 top-2 z-10 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
          INACTIVO
        </div>
      )}

      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {activePromo && (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold text-white shadow-sm">
            PROMO -{activePromo.discount_percentage}%
          </div>
        )}
        {showPlaceholder ? (
          <div className={`flex h-full w-full items-center justify-center bg-white p-6 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}>
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
            alt={product.name}
            className={`h-full w-full object-cover object-center ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-lg font-bold uppercase tracking-wider text-white">Sin Stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-2 text-sm font-medium text-gray-900" title={product.name}>
            {product.name}
          </h3>

          <div className="ml-2 flex flex-col items-end gap-1">
            {fractionalLabel && (
              <span className="inline-flex whitespace-nowrap rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {fractionalLabel}
              </span>
            )}
            {onViewHistory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(product);
                }}
                className="text-gray-400 transition-colors hover:text-indigo-600"
                title="Ver historial"
              >
                <History className="h-4 w-4" />
              </button>
            )}

            <span
              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {product.stock} en stock
            </span>
          </div>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          {product.rubro || 'Sin rubro'} • {product.marca || 'Sin marca'}
        </p>

        <div className="mt-auto">
          <select
            value={selectedPriceListCode}
            onChange={(e) => setSelectedPriceListCode(e.target.value)}
            className="mb-3 block w-full rounded-md border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            disabled={isOutOfStock || isInactive}
          >
            {priceLists.map((list) => (
              <option key={list.id} value={list.code}>
                {list.name}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-xs text-gray-500 line-through">{formatMoney(basePrice || 0)}</span>
              )}
              <span className={`text-lg font-bold ${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                {formatMoney(effectivePrice)}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isInactive}
              className={`flex h-8 w-8 items-center justify-center rounded-full p-0 ${
                isOutOfStock || isInactive ? 'cursor-not-allowed bg-gray-300' : ''
              }`}
              title={
                isInactive
                  ? 'Producto inactivo'
                  : isOutOfStock
                    ? 'Producto sin stock'
                    : 'Agregar al carrito'
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isOutOfStock && (
            <p className="mt-2 flex items-center text-xs text-red-500">
              <AlertCircle className="mr-1 h-3 w-3" /> No disponible para venta
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
