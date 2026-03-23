import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useOfflineSalesStore } from '../store/useOfflineSalesStore';
import { useOnlineStatus } from './useOnlineStatus';
import { supabase } from '../services/supabaseClient';
import { roundMoney } from '../utils/money';

type CheckoutOptions = {
  paymentMethod?: 'efectivo' | 'digital' | 'mixto';
  digitalType?: 'mercadopago' | 'transferencia' | 'tarjeta' | null;
  installments?: number;
  amountCash?: number;
  amountDigital?: number;
  discountType?: 'ninguno' | 'porcentaje' | 'fijo' | 'none' | 'percent' | 'amount';
  discountValue?: number;
};

export const useCart = () => {
  const cartState = useCartStore();
  const { addSale } = useOfflineSalesStore();
  const isOnline = useOnlineStatus();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (
    customerId: string | undefined,
    modalStatus: string,
    options: CheckoutOptions,
    sessionId: string | undefined
  ) => {
    setIsCheckingOut(true);
    setError(null);

    try {
        const itemsPayload = cartState.items.map((item) => {
          const factor =
            item.product.es_fraccionable && item.product.factor_fraccionamiento
              ? item.product.factor_fraccionamiento
              : 1;

          const safeQuantity = Number(item.quantity || 0);
          const safeSubtotal = Number(item.subtotal || 0);
          const safeOriginalPrice = Number(item.originalPrice || 0);

          const finalUnitPrice =
            safeQuantity > 0 ? roundMoney(safeSubtotal / safeQuantity) : 0;

          const quantityToSend = safeQuantity * factor;
          const pricePerUnit = roundMoney(finalUnitPrice / factor);
          const originalPricePerUnit = roundMoney(safeOriginalPrice / factor);
          const totalUnitDiscount = roundMoney(originalPricePerUnit - pricePerUnit);

          let dbDiscountType: 'ninguno' | 'porcentaje' | 'fijo' = 'ninguno';
          if (item.discountType === 'percent' || item.discountType === 'porcentaje') {
            dbDiscountType = 'porcentaje';
          } else if (item.discountType === 'amount' || item.discountType === 'fijo') {
            dbDiscountType = 'fijo';
          }

          // Mapeo de lista de precios para la DB (sale_items)
          const dbPriceList = item.priceType === 'lista_1' ? 'minorista' : 'mayorista';

          return {
            product_id: item.product.id,
            product_name: item.product.name || 'Producto',
            quantity: quantityToSend,
            price: pricePerUnit,
            original_price: originalPricePerUnit,
            discount_type: dbDiscountType,
            discount_value: Number(item.discountValue || 0),
            discount_amount: totalUnitDiscount,
            subtotal: safeSubtotal,
            price_list: dbPriceList,
          };
        });

      const printItems = cartState.items.map((item) => {
        const safeQuantity = Number(item.quantity || 0);
        const safeSubtotal = Number(item.subtotal || 0);
        const safeOriginalPrice = Number(item.originalPrice || 0);

        const unitPrice =
          safeQuantity > 0 ? roundMoney(safeSubtotal / safeQuantity) : 0;

        return {
          productId: item.product.id,
          productName: item.product.name || 'Producto',
          quantity: safeQuantity,
          unitPrice,
          originalUnitPrice: safeOriginalPrice,
          discountAmount: roundMoney((safeOriginalPrice - unitPrice) * safeQuantity),
          subtotal: safeSubtotal,
        };
      });

      const normalizedSaleDiscountType =
        options.discountType === 'percent'
          ? 'porcentaje'
          : options.discountType === 'amount'
            ? 'fijo'
            : options.discountType === 'ninguno' ||
                options.discountType === 'porcentaje' ||
                options.discountType === 'fijo'
              ? options.discountType
              : 'ninguno';

      const globalDbPriceList = cartState.globalPriceList === 'lista_1' ? 'minorista' : 'mayorista';

      console.log('DEBUG - Price List Mapping:', {
        frontend: cartState.globalPriceList,
        backend: globalDbPriceList,
        itemsCount: itemsPayload.length
      });

      const payload = cartState.editingSaleId
        ? {
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
            p_tipo_descuento: normalizedSaleDiscountType,
            p_valor_descuento: options.discountValue || 0,
            p_cliente_id: customerId || null,
            p_caja_id: sessionId || null,
            p_price_list: globalDbPriceList,
          }
        : {
            p_total: cartState.total,
            p_cliente_id: customerId || null,
            p_estado: modalStatus,
            p_items: itemsPayload,
            p_metodo_pago: options.paymentMethod || 'efectivo',
            p_tipo_digital: options.digitalType || null,
            p_cuotas: options.installments || 1,
            p_monto_efectivo: options.amountCash || 0,
            p_monto_digital: options.amountDigital || 0,
            p_tipo_descuento: normalizedSaleDiscountType,
            p_valor_descuento: options.discountValue || 0,
            p_caja_id: sessionId || null,
            p_price_list: globalDbPriceList,
          };

      if (!isOnline) {
        console.log('OFFLINE - Saving sale locally');
        await addSale(payload);
        cartState.clearCart();
        return { success: true, data: { offline: true }, printItems };
      }

      const { data, error: rpcError } = await supabase.rpc(
        cartState.editingSaleId ? 'update_sale_with_items' : 'create_sale_with_status',
        payload
      );

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw rpcError;
      }

      cartState.clearCart();
      return { success: true, data, printItems };
    } catch (err: any) {
      console.error('Checkout error details:', err);
      const message =
        err?.message ||
        err?.details ||
        err?.hint ||
        (typeof err === 'string' ? err : 'Error desconocido al procesar la venta');

      setError(message);
      return { success: false, error: err };
    } finally {
      setIsCheckingOut(false);
    }
  };

  return {
    ...cartState,
    checkout,
    isProcessing: isCheckingOut,
    error,
  };
};