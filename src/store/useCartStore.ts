import { create } from 'zustand';
import { CartItem, Product, Promotion } from '../types';
import { getEffectivePrice, getBasePrice } from '../utils/priceUtils';
import { roundMoney } from '../utils/money';

type CartPriceList = 'minorista' | 'mayorista' | 'carrito';
type CartDiscountType = 'none' | 'percent' | 'amount' | 'ninguno' | 'porcentaje' | 'fijo';

interface CartState {
  items: CartItem[];
  globalPriceList: CartPriceList;
  setGlobalPriceList: (priceList: CartPriceList, promotions: Promotion[]) => void;
  addItem: (product: Product, priceType: 'minorista' | 'mayorista', quantity: number, promotions: Promotion[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, promotions: Promotion[]) => void;
  updateItemDiscount: (productId: string, discountType: CartDiscountType, discountValue: number, promotions: Promotion[]) => void;
  clearCart: () => void;
  loadCartFromSale: (items: any[], priceList?: string) => void;
  subtotal: number;
  total: number;
  editingSaleId: string | null;
  originalPriceList: string | null;
  originalItems: any[]; // Tipado como any[] para los datos crudos de sale_items
  setEditingSaleId: (id: string | null, priceList?: string | null, items?: any[]) => void;
}

const normalizeDiscountType = (discountType: CartDiscountType): 'none' | 'percent' | 'amount' => {
  if (discountType === 'percent' || discountType === 'porcentaje') return 'percent';
  if (discountType === 'amount' || discountType === 'fijo') return 'amount';
  return 'none';
};

const calculateItemValues = (item: CartItem) => {
  const normalizedDiscountType = normalizeDiscountType((item.discountType as CartDiscountType) || 'none');
  const baseUnitPrice = Math.round(Number(item.price || 0));
  const discountValue = Math.round(Number(item.discountValue || 0));
  let finalUnitPrice = baseUnitPrice;
  let discountAmount = 0;
  if (normalizedDiscountType === 'percent' && discountValue > 0) {
    discountAmount = baseUnitPrice * (discountValue / 100);
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  } else if (normalizedDiscountType === 'amount' && discountValue > 0) {
    discountAmount = discountValue;
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  }
  const subtotal = finalUnitPrice * Math.round(Number(item.quantity || 0));
  return { normalizedDiscountType, discountAmount: roundMoney(discountAmount), subtotal: roundMoney(subtotal) };
};

const recalculateTotals = (items: CartItem[]) => {
  const total = roundMoney(items.reduce((acc, item) => acc + Math.round(Number(item.subtotal || 0)), 0));
  return { subtotal: total, total };
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  globalPriceList: 'carrito',
  subtotal: 0,
  total: 0,
  editingSaleId: null,
  originalPriceList: null,
  originalItems: [],

  setEditingSaleId: (id, priceList, items) => set({ editingSaleId: id, originalPriceList: priceList || null, originalItems: items || [] }),

  setGlobalPriceList: (priceList, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        const effectivePriceType = priceList === 'carrito' ? item.priceType : priceList;
        const price = roundMoney(getEffectivePrice(item.product, effectivePriceType, promotions));
        const originalPrice = roundMoney(getBasePrice(item.product, effectivePriceType));
        const updatedItem = { ...item, priceType: effectivePriceType, price, originalPrice };
        const recalculated = calculateItemValues(updatedItem as CartItem);
        return { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
      });
      return { items: newItems, globalPriceList: priceList, ...recalculateTotals(newItems) };
    });
  },

  addItem: (product, priceType, quantity, promotions) => {
    set((state) => {
      const effectivePriceType = state.globalPriceList === 'carrito' ? priceType : state.globalPriceList;
      const existingItemIndex = state.items.findIndex((item) => item.product.id === product.id && item.priceType === effectivePriceType);
      const price = roundMoney(getEffectivePrice(product, effectivePriceType, promotions));
      const originalPrice = roundMoney(getBasePrice(product, effectivePriceType));
      const newItems = [...state.items];
      if (existingItemIndex > -1) {
        const item = newItems[existingItemIndex];
        const updatedItem: CartItem = { ...item, quantity: Math.round(Number(item.quantity || 0)) + Math.round(quantity) };
        const recalculated = calculateItemValues(updatedItem);
        newItems[existingItemIndex] = { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
      } else {
        const newItem: CartItem = { product, priceType: effectivePriceType, price, originalPrice, quantity: Math.round(quantity), subtotal: 0, discountType: 'none', discountValue: 0, discountAmount: 0 };
        const recalculated = calculateItemValues(newItem);
        newItem.discountType = recalculated.normalizedDiscountType;
        newItem.discountAmount = recalculated.discountAmount;
        newItem.subtotal = recalculated.subtotal;
        newItems.push(newItem);
      }
      return { items: newItems, ...recalculateTotals(newItems) };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.product.id !== productId);
      return { items: newItems, ...recalculateTotals(newItems) };
    });
  },

  updateQuantity: (productId, quantity, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = { ...item, quantity: Math.max(0, Math.round(quantity)) };
          const recalculated = calculateItemValues(updatedItem);
          return { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
        }
        return item;
      });
      return { items: newItems, ...recalculateTotals(newItems) };
    });
  },

  updateItemDiscount: (productId, discountType, discountValue, promotions) => {
    set((state) => {
      const normalizedDiscountType = normalizeDiscountType(discountType);
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = { ...item, discountType: normalizedDiscountType, discountValue: Math.round(Number(discountValue || 0)) };
          const recalculated = calculateItemValues(updatedItem);
          return { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
        }
        return item;
      });
      return { items: newItems, ...recalculateTotals(newItems) };
    });
  },

  clearCart: () => set({ items: [], subtotal: 0, total: 0, globalPriceList: 'carrito', editingSaleId: null, originalPriceList: null, originalItems: [] }),

  loadCartFromSale: (items, priceList) => {
    const mappedItems: CartItem[] = (items || []).map((item: any) => {
      const quantity = Math.round(Number(item.quantity || 0));
      const price = roundMoney(Number(item.price || 0));
      const originalPrice = roundMoney(Number(item.original_price ?? item.price ?? 0));
      return {
        product: { id: item.product_id, name: item.product_name || 'Producto' } as Product,
        priceType: (item.price_list === 'mayorista' ? 'mayorista' : 'minorista') as 'minorista' | 'mayorista',
        price, originalPrice, quantity,
        subtotal: roundMoney(quantity * price),
        discountType: (item.discount_type || 'none') as CartDiscountType,
        discountValue: Math.round(Number(item.discount_value || 0)),
        discountAmount: roundMoney(Number(item.discount_amount || 0)),
      };
    });
    set({ items: mappedItems, ...recalculateTotals(mappedItems) });
  },
}));