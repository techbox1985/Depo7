import { create } from 'zustand';
const CART_STORAGE_KEY = 'pos_cart_v1';
import { CartItem, Product, Promotion } from '../types';
import { getEffectivePrice, getBasePrice } from '../utils/priceUtils';
import { roundMoney } from '../utils/money';

type CartPriceList = 'lista_1' | 'lista_2' | 'lista_3';
type CartDiscountType = 'none' | 'percent' | 'amount' | 'ninguno' | 'porcentaje' | 'fijo';

interface CartState {
  items: CartItem[];
  globalPriceList: CartPriceList;
  setGlobalPriceList: (priceList: CartPriceList, promotions: Promotion[]) => void;
  addItem: (product: Product, priceType: 'lista_1' | 'lista_2' | 'lista_3', quantity: number, promotions: Promotion[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, promotions: Promotion[]) => void;
  updateItemDiscount: (productId: string, discountType: CartDiscountType, discountValue: number, promotions: Promotion[]) => void;
  clearCart: () => void;
  loadCartFromSale: (items: any[], products: Product[], priceList?: string) => void;
  subtotal: number;
  totalDiscount: number;
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

const validateFractionalQuantity = (product: Product, quantity: number): number | null => {
  if (!product.es_fraccionable || !product.factor_fraccionamiento) {
    return Math.round(quantity);
  }
  
  const factor = product.factor_fraccionamiento;
  const units = quantity * factor;
  
  if (Math.abs(units - Math.round(units)) > 0.0001) {
    return null; // Invalid
  }
  
  return Math.round(units) / factor;
};

const calculateItemValues = (item: CartItem) => {
  const normalizedDiscountType = normalizeDiscountType((item.discountType as CartDiscountType) || 'none');
  const baseUnitPrice = Number(item.price || 0);
  const discountValue = Number(item.discountValue || 0);
  let finalUnitPrice = baseUnitPrice;
  let discountAmount = 0;

  if (normalizedDiscountType === 'percent' && discountValue > 0) {
    // Aplica descuento porcentual SOLO sobre el precio unitario
    discountAmount = baseUnitPrice * (discountValue / 100);
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  } else if (normalizedDiscountType === 'amount' && discountValue > 0) {
    // Aplica descuento fijo SOLO sobre el precio unitario
    discountAmount = discountValue;
    finalUnitPrice = Math.max(0, baseUnitPrice - discountAmount);
  } else {
    discountAmount = 0;
    finalUnitPrice = baseUnitPrice;
  }

  // Subtotal = precio final * cantidad
  const subtotal = finalUnitPrice * Number(item.quantity || 0);
  return {
    normalizedDiscountType,
    // El descuento total aplicado al ítem es por unidad * cantidad
    discountAmount: roundMoney(discountAmount * Number(item.quantity || 0)),
    subtotal: roundMoney(subtotal)
  };
};

const recalculateTotals = (items: CartItem[]) => {
  const grossSubtotal = roundMoney(items.reduce((acc, item) => acc + Number(item.originalPrice * item.quantity || 0), 0));
  const total = roundMoney(items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0));
  const totalDiscount = roundMoney(grossSubtotal - total);
  return { subtotal: grossSubtotal, totalDiscount, total };
};

// --- Estado inicial con restauración de localStorage ---
const getInitialCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) {
        return {
          items: parsed.items,
          globalPriceList: parsed.globalPriceList || 'lista_1',
          subtotal: parsed.subtotal || 0,
          totalDiscount: parsed.totalDiscount || 0,
          total: parsed.total || 0,
          editingSaleId: null,
          originalPriceList: null,
          originalItems: [],
        };
      }
    }
  } catch (e) {
    // fallback seguro
  }
  return {
    items: [],
    globalPriceList: 'lista_1',
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    editingSaleId: null,
    originalPriceList: null,
    originalItems: [],
  };
};

export const useCartStore = create<CartState>((set, get) => ({
  ...getInitialCart(),

  setEditingSaleId: (id, priceList, items) => set({ editingSaleId: id, originalPriceList: priceList || null, originalItems: items || [] }),

  setGlobalPriceList: (priceList, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        const effectivePriceType = priceList;
        const price = roundMoney(getEffectivePrice(item.product, effectivePriceType, promotions));
        const originalPrice = roundMoney(getBasePrice(item.product, effectivePriceType));
        const updatedItem = { ...item, priceType: effectivePriceType, price, originalPrice };
        const recalculated = calculateItemValues(updatedItem as CartItem);
        return { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
      });
      const persist = { items: newItems, globalPriceList: priceList, ...recalculateTotals(newItems) };
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    });
  },

  addItem: (product, priceType, quantity, promotions) => {
    set((state) => {
      const validatedQuantity = validateFractionalQuantity(product, quantity);
      if (validatedQuantity === null) return state;

      const effectivePriceType = state.globalPriceList;
      const existingItemIndex = state.items.findIndex((item) => item.product.id === product.id && item.priceType === effectivePriceType);
      const price = roundMoney(getEffectivePrice(product, effectivePriceType, promotions));
      const originalPrice = roundMoney(getBasePrice(product, effectivePriceType));
      const newItems = [...state.items];
      if (existingItemIndex > -1) {
        const item = newItems[existingItemIndex];
        const updatedItem: CartItem = { ...item, quantity: Number(item.quantity || 0) + validatedQuantity };
        const recalculated = calculateItemValues(updatedItem);
        newItems[existingItemIndex] = { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
      } else {
        // Blindar shape: siempre incluir product, cod, name, price, quantity
        const newItem: CartItem = {
          product,
          priceType: effectivePriceType,
          price,
          originalPrice,
          quantity: validatedQuantity,
          subtotal: 0,
          discountType: 'none',
          discountValue: 0,
          discountAmount: 0,
          cod: product.cod,
          name: product.name,
        };
        const recalculated = calculateItemValues(newItem);
        newItem.discountType = recalculated.normalizedDiscountType;
        newItem.discountAmount = recalculated.discountAmount;
        newItem.subtotal = recalculated.subtotal;
        newItems.push(newItem);
      }
      
      const item = newItems[existingItemIndex > -1 ? existingItemIndex : newItems.length - 1];

      const persist = { items: newItems, ...recalculateTotals(newItems), globalPriceList: state.globalPriceList };
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.product.id !== productId);
      const persist = { items: newItems, ...recalculateTotals(newItems), globalPriceList: state.globalPriceList };
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    });
  },

  updateQuantity: (productId, quantity, promotions) => {
    set((state) => {
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const validatedQuantity = validateFractionalQuantity(item.product, quantity);
          if (validatedQuantity === null) return item;
          const updatedItem: CartItem = { ...item, quantity: Math.max(0, validatedQuantity) };
          const recalculated = calculateItemValues(updatedItem);
          const newItem = { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
          
          return newItem;
        }
        return item;
      });
      const persist = { items: newItems, ...recalculateTotals(newItems), globalPriceList: state.globalPriceList };
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    });
  },

  updateItemDiscount: (productId, discountType, discountValue, promotions) => {
    set((state) => {
      const normalizedDiscountType = normalizeDiscountType(discountType);
      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = { ...item, discountType: normalizedDiscountType, discountValue: Number(discountValue || 0) };
          const recalculated = calculateItemValues(updatedItem);
          const newItem = { ...updatedItem, discountType: recalculated.normalizedDiscountType, discountAmount: recalculated.discountAmount, subtotal: recalculated.subtotal };
          
          return newItem;
        }
        return item;
      });
      const persist = { items: newItems, ...recalculateTotals(newItems), globalPriceList: state.globalPriceList };
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persist)); } catch {}
      return persist;
    });
  },

  clearCart: () => {
    set({ items: [], subtotal: 0, totalDiscount: 0, total: 0, globalPriceList: 'lista_1', editingSaleId: null, originalPriceList: null, originalItems: [] });
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch {}
  },

  loadCartFromSale: (items, products, priceList) => {
    const mappedPriceList = (priceList === 'mayorista' ? 'lista_2' : 'lista_1') as 'lista_1' | 'lista_2' | 'lista_3';
    const mappedItems: CartItem[] = (items || []).map((item: any, index: number) => {
      const product = products.find(p => p.id === item.product_id);
      const isFractionable = product?.es_fraccionable && product?.factor_fraccionamiento;
      const factor = isFractionable ? (product?.factor_fraccionamiento || 1) : 1;
      
      const quantityUnits = Number(item.quantity || 0);
      const quantity = quantityUnits / factor;
      const price = Number(item.price || 0);
      const originalPrice = Number(item.original_price ?? item.price ?? 0);
      const discountValue = Number(item.discount_value || 0);
      const discountAmount = roundMoney(Number(item.discount_amount || 0));
      
      const subtotal = roundMoney(quantity * price - discountAmount);

      return {
        product: product || { id: item.product_id || `temp-${index}`, name: item.product_name || 'Producto' } as Product,
        priceType: (item.price_list === 'mayorista' ? 'lista_2' : 'lista_1') as 'lista_1' | 'lista_2' | 'lista_3',
        price, originalPrice, quantity,
        subtotal,
        discountType: (item.discount_type || 'none') as CartDiscountType,
        discountValue,
        discountAmount,
      };
    });
    set({ items: mappedItems, globalPriceList: mappedPriceList, ...recalculateTotals(mappedItems) });
  },
}));
