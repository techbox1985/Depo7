
import { supabase } from './supabaseClient';
import { CartItem, Sale } from '../types';
import { offlineDb } from './offlineDb';

export interface CreateSaleSupabaseParams {
  items: CartItem[];
  total: number;
  customerId?: string;
  sale_kind: 'venta' | 'pedido' | 'presupuesto';
  estado: Sale['estado'];
  cajaId?: string | null;
}

export const salesService = {
  async createSale(
    items: CartItem[],
    total: number,
    customerId?: string,
    tipo: 'venta' | 'pedido' | 'presupuesto' = 'venta',
    cajaId?: string | null
  ): Promise<Sale> {
    const client_txn_id = crypto.randomUUID();
    let estado: Sale['estado'];
    let sale_kind: Sale['sale_kind'];
    if (tipo === 'venta') { sale_kind = 'venta'; estado = 'completada'; }
    else if (tipo === 'pedido') { sale_kind = 'pedido'; estado = 'pendiente'; }
    else { sale_kind = 'presupuesto'; estado = 'presupuesto'; }

    if (navigator.onLine) {
      try {
        return await this.createSaleSupabase({ items, total, customerId, sale_kind, estado, cajaId });
      } catch (e) {
        console.warn('Supabase create sale failed, saving offline', e);
      }
    }
    await offlineDb.saveSale({ client_txn_id, items, total, customerId, sale_kind, estado, cajaId, createdAt: new Date().toISOString() });
    return { id: client_txn_id, codigo_venta: client_txn_id, estado, sale_kind, total, caja_id: cajaId } as any;
  },

  async createSaleSupabase(params: CreateSaleSupabaseParams): Promise<Sale> {
    const { items, total, customerId, sale_kind, estado, cajaId } = params;
    // 1. Armado de salePayload
    const now = new Date().toISOString();
    const codigo_venta = `VEN-${now.replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.floor(Math.random()*10000)}`;
    const priceList = (items[0]?.price_list || items[0]?.priceList) === 'mayorista' ? 'mayorista' : 'minorista';
    const metodoPago = 'efectivo';
    const tipoDigital = null;
    const tipoDescuento = 'ninguno';
    const cuotas = null;
    const salePayload = {
      codigo_venta,
      cliente_id: customerId || null,
      caja_id: cajaId || null,
      total,
      estado,
      sale_kind,
      metodo_pago: metodoPago,
      tipo_digital: tipoDigital,
      cuotas,
      monto_efectivo: total,
      monto_digital: 0,
      tipo_descuento: tipoDescuento,
      valor_descuento: 0,
      total_productos: items.reduce((acc, item) => acc + Number(item.quantity), 0),
      fecha: now,
      creado_en: now,
      actualizado_en: now,
      price_list: priceList,
      truck_id: null,
      prepared_at: null,
      loaded_at: null,
      delivered_at: null,
      delivery_date: null,
    };
    // [DIAG salesService] Log de salePayload y caja_id
    console.log('[DIAG salesService] salePayload:', salePayload);
    console.log('[DIAG salesService] salePayload.caja_id:', salePayload.caja_id);
    // 2. Insert en sales
    let createdSale;
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([salePayload])
        .select()
        .single();
      if (error || !data) {
        console.error('[DIAG salesService] Error insert sales:', error);
        throw error || new Error('No se pudo crear la venta');
      }
      createdSale = data;
      console.log('[DIAG salesService] Resultado insert sales:', createdSale);
    } catch (err) {
      console.error('[DIAG salesService] CATCH error insert sales:', err);
      throw err;
    }

    // 3. Validación de respuesta
    if (!createdSale || !createdSale.id) {
      console.error('[createSaleSupabase] Insert sales no devolvió id de venta', createdSale);
      throw new Error('No se pudo obtener el id de la venta creada');
    }

    // 4. Armado de saleItemsToInsert
    const saleItemsToInsert = items.map(item => {
      const priceList = (item.price_list || item.priceList) === 'mayorista' ? 'mayorista' : 'minorista';
      let discountType = 'none';
      if (item.discountType === 'percent') discountType = 'percent';
      else if (item.discountType === 'amount') discountType = 'amount';
      return {
        sale_id: createdSale.id,
        product_id: item.product?.id || item.id,
        product_name: item.name || item.product?.name || '',
        quantity: Number(item.quantity),
        price: Number(item.final_price || item.price || item.originalPrice || 0),
        original_price: Number(item.originalPrice || item.price || 0),
        created_at: now,
        price_list: priceList,
        discount_type: discountType,
        discount_value: Number(item.discountValue || 0),
        discount_amount: Number(item.discountAmount || 0),
      };
    });

    // 5. Insert en sale_items
    try {
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
      if (itemsError) {
        console.error('[createSaleSupabase] Error insert sale_items:', itemsError);
        throw itemsError;
      }
    } catch (err) {
      console.error('[createSaleSupabase] CATCH error insert sale_items:', err);
      throw err;
    }

    // 6. Descontar stock solo si es venta real (no pedido ni presupuesto)
    if (params.sale_kind === 'venta' && params.estado === 'completada') {
      for (const item of params.items) {
        // Si el producto tiene control de stock (stock !== null && !isNaN)
        if (item.product && typeof item.product.stock === 'number') {
          try {
            const oldStock = item.product.stock;
            const newStock = oldStock - item.quantity;
            // [DIAG Stock] producto, cantidad, stock anterior, stock nuevo
            console.log('[DIAG Stock] Producto:', item.product.id, 'Cantidad vendida:', item.quantity, 'Stock anterior:', oldStock, 'Stock nuevo:', newStock);
            await import('./productsService').then(m => m.productsService.updateProduct(item.product.id, { stock: newStock }));
          } catch (err) {
            console.error('[DIAG Stock] Error al descontar stock producto', item.product.id, err);
          }
        }
      }
    }
    // 7. Retorno final solo si todo fue exitoso
    return {
      id: createdSale.id,
      codigo_venta: createdSale.codigo_venta,
      cliente_id: createdSale.cliente_id,
      caja_id: createdSale.caja_id,
      total: createdSale.total,
      estado: createdSale.estado,
      metodo_pago: createdSale.metodo_pago,
      tipo_digital: createdSale.tipo_digital,
      cuotas: createdSale.cuotas,
      monto_efectivo: createdSale.monto_efectivo,
      monto_digital: createdSale.monto_digital,
      tipo_descuento: createdSale.tipo_descuento,
      valor_descuento: createdSale.valor_descuento,
      price_list: createdSale.price_list,
      total_productos: createdSale.total_productos,
      fecha: createdSale.fecha,
      creado_en: createdSale.creado_en,
      actualizado_en: createdSale.actualizado_en,
    };
  }
};
