import { create } from 'zustand';
import { CartItem, Product, Promotion } from '../types';
import { getEffectivePrice, getBasePrice } from '../utils/priceUtils';

type CartPriceList = 'minorista' | 'mayorista' | 'carrito';
type CartDiscountType = 'none' | 'percent' | 'amount' | 'ninguno' | 'porcentaje' | 'fijo';

interface CartState {
  items: CartItem[];
  globalPriceList: CartPriceList;
  setGlobalPriceList: (priceList: CartPriceList, promotions: Promotion[]) => void;
  addItem: (
    product: Product,
    priceType: 'minorista' | 'mayorista',
    quantity: number,
    promotions: Promotion[]
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, promotions: Promotion[]) => void;
  updateItemDiscount: (
    productId: string,
    discountType: CartDiscountType,
    discountValue: number,
    promotions: Promotion[]
  ) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
}

const normalizeDiscountType = (discountType: CartDiscountType): 'none' | 'percent' | 'amount' => {
  if (discountType === 'percent' || discountType === 'porcentaje') return 'percent';
  if (discountType === 'amount' || discountType === 'fijo') return 'amount';
  return 'none';
};

const round2 = (value: number): number => Number((value || 0).toFixed(2));

const calculateItemValues = (item: CartItem) => {
  const normalizedDiscountType = normalizeDiscountType((item.discountType as CartDiscountType) || 'none');
  const baseUnitPrice = Number(item.price || 0);
  const discountValue = Number(item.discountValue || 0);

  let finalUnitPrice = baseUnitPrice;
  let discountAmount = 0;

  if (normalizedDiscountType === 'percent' && discountValue > 0) {
    discountAmount = baseUnitPrice * (discountValue / 100);
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  } else if (normalizedDiscountType === 'amount' && discountValue > 0) {
    discountAmount = discountValue;
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  }

  const subtotal = finalUnitPrice * Number(item.quantity || 0);

  return {
    normalizedDiscountType,
    discountAmount: round2(discountAmount),
    subtotal: round2(subtotal),
  };
};

const recalculateTotals = (items: CartItem[]) => {
  const total = round2(items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0));
  return { subtotal: total, total };
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  globalPriceList: 'carrito',
  subtotal: 0,
  total: 0,

  setGlobalPriceList: (priceList, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        const effectivePriceType = priceList === 'carrito' ? item.priceType : priceList;
        const price = round2(getEffectivePrice(item.product, effectivePriceType, promotions));
        const originalPrice = round2(getBasePrice(item.product, effectivePriceType));

        const updatedItem = {
          ...item,
          priceType: effectivePriceType,
          price,
          originalPrice,
        };

        const recalculated = calculateItemValues(updatedItem as CartItem);

        return {
          ...updatedItem,
          discountType: recalculated.normalizedDiscountType,
          discountAmount: recalculated.discountAmount,
          subtotal: recalculated.subtotal,
        };
      });

      return {
        items: newItems,
        globalPriceList: priceList,
        ...recalculateTotals(newItems),
      };
    });
  },

  addItem: (product, priceType, quantity, promotions) => {
    set((state) => {
      const effectivePriceType = state.globalPriceList === 'carrito' ? priceType : state.globalPriceList;

      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === product.id && item.priceType === effectivePriceType
      );

      const price = round2(getEffectivePrice(product, effectivePriceType, promotions));
      const originalPrice = round2(getBasePrice(product, effectivePriceType));

      const newItems = [...state.items];

      if (existingItemIndex > -1) {
        const item = newItems[existingItemIndex];
        const updatedItem: CartItem = {
          ...item,
          quantity: Number(item.quantity || 0) + quantity,
        };

        const recalculated = calculateItemValues(updatedItem);

        newItems[existingItemIndex] = {
          ...updatedItem,
          discountType: recalculated.normalizedDiscountType,
          discountAmount: recalculated.discountAmount,
          subtotal: recalculated.subtotal,
        };
      } else {
        const newItem: CartItem = {
          product,
          priceType: effectivePriceType,
          price,
          originalPrice,
          quantity,
          subtotal: 0,
          discountType: 'none',
          discountValue: 0,
          discountAmount: 0,
        };

        const recalculated = calculateItemValues(newItem);

        newItem.discountType = recalculated.normalizedDiscountType;
        newItem.discountAmount = recalculated.discountAmount;
        newItem.subtotal = recalculated.subtotal;

        newItems.push(newItem);
      }

      return {
        items: newItems,
        ...recalculateTotals(newItems),
      };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.product.id !== productId);
      return {
        items: newItems,
        ...recalculateTotals(newItems),
      };
    });
  },

  updateQuantity: (productId, quantity, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = {
            ...item,
            quantity: Math.max(0, quantity),
          };

          const recalculated = calculateItemValues(updatedItem);

          return {
            ...updatedItem,
            discountType: recalculated.normalizedDiscountType,
            discountAmount: recalculated.discountAmount,
            subtotal: recalculated.subtotal,
          };
        }

        return item;
      });

      return {
        items: newItems,
        ...recalculateTotals(newItems),
      };
    });
  },

  updateItemDiscount: (productId, discountType, discountValue, promotions) => {
    set((state) => {
      const normalizedDiscountType = normalizeDiscountType(discountType);

      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = {
            ...item,
            discountType: normalizedDiscountType,
            discountValue: Number(discountValue || 0),
          };

          const recalculated = calculateItemValues(updatedItem);

          return {
            ...updatedItem,
            discountType: recalculated.normalizedDiscountType,
            discountAmount: recalculated.discountAmount,
            subtotal: recalculated.subtotal,
          };
        }

        return item;
      });

      return {
        items: newItems,
        ...recalculateTotals(newItems),
      };
    });
  },

  clearCart: () =>
    set({
      items: [],
      subtotal: 0,
      total: 0,
      globalPriceList: 'carrito',
    }),
}));