import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { usePromotionsStore } from '../store/usePromotionsStore';
import { Product } from '../types';
import { supabase } from '../services/supabaseClient';
import { getBasePrice, getEffectivePrice } from '../utils/priceUtils';
import { roundMoney } from '../utils/money';

type PriceListType = 'minorista' | 'mayorista' | 'carrito';
type SaleDiscountType = 'ninguno' | 'porcentaje' | 'fijo';

const isValidUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const toLineDiscountType = (value: unknown): 'none' | 'percent' | 'amount' => {
  if (value === 'percent' || value === 'porcentaje') return 'percent';
  if (value === 'amount' || value === 'fijo') return 'amount';
  return 'none';
};

export const useCart = () => {
  const cartStore = useCartStore();
  const { promotions } = usePromotionsStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = (product: Product, priceType: 'minorista' | 'mayorista', quantity: number = 1) => cartStore.addItem(product, priceType, quantity, promotions);
  const updateQuantity = (productId: string, quantity: number) => cartStore.updateQuantity(productId, quantity, promotions);
  const setGlobalPriceList = (priceList: PriceListType) => cartStore.setGlobalPriceList(priceList, promotions);
  const updateItemDiscount = (productId: string, discountType: any, discountValue: number) => cartStore.updateItemDiscount(productId, discountType, discountValue, promotions);

  const checkout = async (customerId?: string, status: 'completada' | 'pendiente' | 'presupuesto' = 'completada', options?: any, cashClosingId?: string) => {
    if (cartStore.items.length === 0) { setError('El carrito está vacío'); return; }
    if (customerId && !isValidUuid(customerId)) { setError('ID de cliente inválido'); return; }
    if (cashClosingId && !isValidUuid(cashClosingId)) { setError('ID de caja inválido'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      let calculatedTotal = 0;
      const itemsPayload = cartStore.items.map((item) => {
        const effectivePriceList = options?.priceList && options.priceList !== 'carrito' ? options.priceList : item.priceType;
        const basePrice = getEffectivePrice(item.product, effectivePriceList as 'minorista' | 'mayorista', promotions);
        const originalPrice = getBasePrice(item.product, effectivePriceList as 'minorista' | 'mayorista');
        let finalItemPrice = basePrice;
        let itemDiscountAmount = 0;
        const normalizedDiscountType = toLineDiscountType(item.discountType);
        const safeDiscountValue = Math.round(Number(item.discountValue) || 0);
        if (normalizedDiscountType === 'percent' && safeDiscountValue > 0) {
          itemDiscountAmount = basePrice * (safeDiscountValue / 100);
          finalItemPrice = Math.max(0, basePrice - itemDiscountAmount);
        } else if (normalizedDiscountType === 'amount' && safeDiscountValue > 0) {
          itemDiscountAmount = safeDiscountValue;
          finalItemPrice = Math.max(0, basePrice - itemDiscountAmount);
        }
        itemDiscountAmount = Math.max(0, roundMoney(itemDiscountAmount));
        finalItemPrice = Math.max(0, roundMoney(finalItemPrice));
        const itemSubtotal = roundMoney(finalItemPrice * Math.round(item.quantity));
        calculatedTotal += itemSubtotal;

        const isFractionable = item.product.es_fraccionable && item.product.factor_fraccionamiento;
        const factor = isFractionable ? (item.product.factor_fraccionamiento || 1) : 1;
        const quantityUnits = item.quantity * factor;
        const pricePerUnit = finalItemPrice / factor;
        const originalPricePerUnit = originalPrice / factor;

        return { 
          product_id: item.product.id, 
          product_name: item.product.name, 
          quantity: quantityUnits, 
          price: pricePerUnit, 
          original_price: roundMoney(originalPricePerUnit), 
          price_list: effectivePriceList, 
          discount_type: normalizedDiscountType, 
          discount_value: safeDiscountValue, 
          discount_amount: itemDiscountAmount 
        };
      });

      if (options?.discountType === 'porcentaje') calculatedTotal = calculatedTotal * (1 - (options.discountValue || 0) / 100);
      else if (options?.discountType === 'fijo') calculatedTotal = Math.max(0, calculatedTotal - (options.discountValue || 0));
      calculatedTotal = roundMoney(calculatedTotal);

      // 3. Validación defensiva del total
      const totalPago = (options?.amountCash || 0) + (options?.amountDigital || 0);
      if (status === 'completada' && calculatedTotal === 0 && totalPago === 0) {
        throw new Error('No se puede completar una venta con total 0 y sin pagos.');
      }
      if (calculatedTotal === 0 && totalPago > 0) {
        calculatedTotal = totalPago;
      }
      if (calculatedTotal === 0 && cartStore.items.length > 0) {
        calculatedTotal = cartStore.total;
      }

      if (cartStore.editingSaleId) {
        // 1. Validar stock antes de actualizar
        for (const item of cartStore.items) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product.id).single();
          const originalQty = cartStore.originalItems.find(oi => oi.product_id === item.product.id)?.quantity || 0;
          const delta = item.quantity - originalQty;
          if (delta > 0 && (prod?.stock || 0) < delta) throw new Error(`Stock insuficiente para ${item.product.name}`);
        }

        // 2. Actualizar venta y items vía RPC
        const finalPriceList = (options?.priceList && options.priceList !== 'carrito' ? options.priceList : cartStore.originalPriceList) || 'minorista';
        
        const payload = {
          p_sale_id: cartStore.editingSaleId,
          p_total: calculatedTotal,
          p_total_productos: cartStore.items.length,
          p_estado: status,
          p_items: itemsPayload,
          p_metodo_pago: options?.paymentMethod || 'efectivo',
          p_tipo_digital: options?.digitalType || null,
          p_cuotas: options?.installments || 1,
          p_monto_efectivo: options?.amountCash || 0,
          p_monto_digital: options?.amountDigital || 0,
          p_tipo_descuento: options?.discountType || 'ninguno',
          p_valor_descuento: options?.discountValue || 0,
          p_cliente_id: customerId || null,
          p_caja_id: cashClosingId || null,
          p_price_list: finalPriceList
        };

        const { error: rpcError } = await supabase.rpc('update_sale_with_items', payload);
        if (rpcError) throw rpcError;

        cartStore.clearCart();
        return payload;
      } else {
        const payload = { p_total: calculatedTotal, p_cliente_id: customerId || null, p_estado: status, p_items: itemsPayload, p_metodo_pago: options?.paymentMethod || 'efectivo', p_tipo_digital: options?.digitalType || null, p_cuotas: options?.installments || 1, p_monto_efectivo: options?.amountCash || 0, p_monto_digital: options?.amountDigital || 0, p_tipo_descuento: options?.discountType || 'ninguno', p_valor_descuento: options?.discountValue || 0, p_price_list: options?.priceList && options.priceList !== 'carrito' ? options.priceList : null, p_caja_id: cashClosingId || null };
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_sale_with_status', payload);
        if (rpcError) throw rpcError;
        if (cashClosingId && rpcData?.id) await supabase.from('sales').update({ caja_id: cashClosingId }).eq('id', rpcData.id);
        cartStore.clearCart();
        return payload;
      }
    } catch (err: any) {
      console.error('Error processing sale:', err);
      setError(err.message || 'Error al procesar la venta');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { items: cartStore.items, subtotal: cartStore.subtotal, total: cartStore.total, globalPriceList: cartStore.globalPriceList, setGlobalPriceList, updateItemDiscount, addItem, removeItem: cartStore.removeItem, updateQuantity, clearCart: cartStore.clearCart, checkout, isProcessing, error };
};