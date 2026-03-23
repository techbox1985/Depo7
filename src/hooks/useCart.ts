import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { supabase } from '../services/supabaseClient';
import { roundMoney } from '../utils/money';

export const useCart = () => {
  const cartState = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (customerId: string | undefined, modalStatus: string, options: any, sessionId: string | undefined) => {
    setIsCheckingOut(true);
    setError(null);
    try {
      const itemsPayload = cartState.items.map(item => {
        const factor = item.product.es_fraccionable && item.product.factor_fraccionamiento ? item.product.factor_fraccionamiento : 1;
        
        // El subtotal ya contempla promociones y descuentos manuales
        // Calculamos el precio final unitario real a partir del subtotal
        const finalUnitPrice = roundMoney(item.subtotal / item.quantity);
        
        const quantityToSend = item.quantity * factor;
        const pricePerUnit = roundMoney(finalUnitPrice / factor);
        const originalPricePerUnit = roundMoney(item.originalPrice / factor);
        
        // El discount_amount que espera el backend suele ser el descuento total por unidad
        const totalUnitDiscount = roundMoney(originalPricePerUnit - pricePerUnit);

        // Normalizar tipos de descuento para la DB
        let dbDiscountType: 'ninguno' | 'porcentaje' | 'fijo' = 'ninguno';
        if (item.discountType === 'percent' || item.discountType === 'porcentaje') dbDiscountType = 'porcentaje';
        else if (item.discountType === 'amount' || item.discountType === 'fijo') dbDiscountType = 'fijo';
        
        return {
          product_id: item.product.id,
          quantity: quantityToSend,
          price: pricePerUnit,
          original_price: originalPricePerUnit,
          discount_type: dbDiscountType,
          discount_value: item.discountValue || 0,
          discount_amount: totalUnitDiscount,
          subtotal: item.subtotal
        };
      });

      const printItems = cartState.items.map(item => {
        const unitPrice = roundMoney(item.subtotal / item.quantity);
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: unitPrice,
          originalUnitPrice: item.originalPrice,
          discountAmount: roundMoney((item.originalPrice - unitPrice) * item.quantity),
          subtotal: item.subtotal
        };
      });

      const payload = cartState.editingSaleId ? {
        p_sale_id: cartState.editingSaleId,
        p_total: cartState.total,
        p_total_productos: cartState.items.length,
        p_estado: modalStatus,
        p_items: itemsPayload,
        p_metodo_pago: options.paymentMethod || 'efectivo',
        p_tipo_digital: options.digitalType || null,
        p_cuotas: options.installments || 1,
        p_monto_efectivo: options.amountCash || 0,
        p_monto_digital: options.amountDigital || 0,
        p_tipo_descuento: options.discountType || 'ninguno',
        p_valor_descuento: options.discountValue || 0,
        p_cliente_id: customerId || null,
        p_caja_id: sessionId || null,
        p_price_list: cartState.items[0]?.priceType || 'lista_1'
      } : {
        p_total: cartState.total,
        p_cliente_id: customerId || null,
        p_estado: modalStatus,
        p_items: itemsPayload,
        p_metodo_pago: options.paymentMethod || 'efectivo',
        p_tipo_digital: options.digitalType || null,
        p_cuotas: options.installments || 1,
        p_monto_efectivo: options.amountCash || 0,
        p_monto_digital: options.amountDigital || 0,
        p_tipo_descuento: options.discountType || 'ninguno',
        p_valor_descuento: options.discountValue || 0,
        p_caja_id: sessionId || null,
        p_price_list: cartState.items[0]?.priceType || 'lista_1'
      };

      const { data, error: rpcError } = await supabase.rpc(cartState.editingSaleId ? 'update_sale_with_items' : 'create_sale_with_status', payload);

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw rpcError;
      }

      cartState.clearCart();
      return { success: true, data, printItems };
    } catch (err: any) {
      console.error('Checkout error details:', err);
      // Intentar extraer el mensaje de error más descriptivo
      const message = err.message || err.details || err.hint || (typeof err === 'string' ? err : 'Error desconocido al procesar la venta');
      setError(message);
      return { success: false, error: err };
    } finally {
      setIsCheckingOut(false);
    }
  };

  return { ...cartState, checkout, isProcessing: isCheckingOut, error };
};