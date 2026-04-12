import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { formatMoney } from '../../utils/money';
import CustomerAutocomplete from './CustomerAutocomplete';
import { EditCustomerModal } from './EditCustomerModal';
import { customersService } from '../../services/customersService';
import { usePriceLists } from '../../hooks/usePriceLists';

const discountTypes = [
  { value: 'none', label: 'Sin descuento' },
  { value: 'percent', label: 'Porcentaje (%)' },
  { value: 'fixed', label: 'Monto fijo' },
];

const paymentMethods = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

export type SaleActionMode = 'cobrar' | 'presupuesto' | 'pedido';

interface SaleActionModalProps {
  open: boolean;
  mode: SaleActionMode;
  onClose: () => void;
  onConfirm: (data: any) => void;
  items: any[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  priceList: string;
  client?: string;
}

export const SaleActionModal = forwardRef<any, SaleActionModalProps>(({
  open,
  mode,
  onClose,
  onConfirm,
  items,
  subtotal,
  totalDiscount,
  total,
  priceList,
  client: initialClient,
}, ref) => {
  // Cliente
  const [client, setClient] = useState(initialClient || 'Consumidor Final');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  // Modal edición cliente
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  // Tipo entrega pedido
  const [deliveryType, setDeliveryType] = useState(''); // '' | 'retiro' | 'envio'
  // Validación específica pedido
  const [pedidoError, setPedidoError] = useState('');
  // Lista de precios
  const { priceLists } = usePriceLists();
  const [selectedPriceList, setSelectedPriceList] = useState(priceList || 'lista_1');
  // Usar SIEMPRE los valores que vienen del carrito como base
  const modalItems = items;
  const modalSubtotal = subtotal;
  const modalTotalDiscount = totalDiscount;
  const modalTotal = total;
  // Descuento
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  // Pago mixto
  const [amountCash, setAmountCash] = useState(0);
  const [amountDigital, setAmountDigital] = useState(0);
  const [digitalType, setDigitalType] = useState('mercadopago');
  const [installments, setInstallments] = useState(1);
  // Validación
  const [showValidation, setShowValidation] = useState(false);

  // BASE: SIEMPRE usar el neto real del carrito
  const bruto = modalSubtotal;
  const descuentoPorItems = modalTotalDiscount;
  const totalNetoBase = modalTotal; // ya viene del carrito: subtotal - descuentos por ítem
  let descuentoGeneral = 0;
  if (discountType === 'percent') {
    descuentoGeneral = Math.round(totalNetoBase * (discountValue / 100));
  } else if (discountType === 'fixed') {
    descuentoGeneral = Math.min(discountValue, totalNetoBase);
  }
  const finalTotal = Math.max(0, totalNetoBase - descuentoGeneral);

  // Validación de pago mixto
  const paymentSum = Number(amountCash) + Number(amountDigital);
  const paymentValid = paymentSum === finalTotal;

  const confirmData = {
    mode,
    client: selectedCustomer ? selectedCustomer.name : client,
    customerId: selectedCustomer ? selectedCustomer.id : undefined,
    priceList: selectedPriceList,
    discountType,
    discountValue,
    descuentoGeneral,
    items: modalItems,
    total: finalTotal,
    paymentMethod: amountCash > 0 && amountDigital > 0 ? 'mixto' : (amountCash > 0 ? 'efectivo' : 'digital'),
    amountCash,
    amountDigital,
    digitalType: amountDigital > 0 ? digitalType : undefined,
    installments: amountDigital > 0 && digitalType === 'tarjeta' ? installments : undefined,
    deliveryType: mode === 'pedido' ? deliveryType : undefined,
  };
  // Exponer función de confirmación real
  useImperativeHandle(ref, () => ({
    confirm: () => onConfirm(confirmData),
  }));

  const titles = {
    cobrar: 'Cobrar venta',
    presupuesto: 'Generar presupuesto',
    pedido: 'Generar pedido',
  };
  const confirmLabels = {
    cobrar: 'Confirmar F2',
    presupuesto: 'Confirmar presupuesto',
    pedido: 'Confirmar pedido',
  };

  // --- AUTOBALANCEO INTELIGENTE ENTRE EFECTIVO Y DIGITAL ---
  // Controla cuál campo fue editado por última vez
  const [lastEdited, setLastEdited] = useState<'cash' | 'digital'>('cash');

  // Resetear montos al abrir/cambiar total
  useEffect(() => {
    setAmountCash(finalTotal);
    setAmountDigital(0);
    setLastEdited('cash');
  }, [finalTotal, open]);

  // Cuando cambia efectivo, ajustar digital
  useEffect(() => {
    if (lastEdited === 'cash') {
      let efectivo = Number(amountCash) || 0;
      efectivo = Math.max(0, Math.min(efectivo, finalTotal));
      const digital = Math.max(0, finalTotal - efectivo);
      if (amountDigital !== digital) setAmountDigital(digital);
    }
    // eslint-disable-next-line
  }, [amountCash]);

  // Cuando cambia digital, ajustar efectivo
  useEffect(() => {
    if (lastEdited === 'digital') {
      let digital = Number(amountDigital) || 0;
      digital = Math.max(0, Math.min(digital, finalTotal));
      const efectivo = Math.max(0, finalTotal - digital);
      if (amountCash !== efectivo) setAmountCash(efectivo);
    }
    // eslint-disable-next-line
  }, [amountDigital]);

  // --- Validaciones de pedido ---
  useEffect(() => {
    if (mode !== 'pedido') return;
    setPedidoError('');
    // Cliente obligatorio
    if (!selectedCustomer || selectedCustomer.name === 'Consumidor Final') {
      setPedidoError('Debe seleccionar un cliente real para el pedido.');
      return;
    }
    // Tipo entrega obligatorio
    if (!deliveryType) {
      setPedidoError('Debe elegir el tipo de entrega.');
      return;
    }
    // Si es envío, validar dirección y teléfono
    if (deliveryType === 'envio') {
      if (!selectedCustomer.address || !selectedCustomer.phone) {
        setPedidoError('Debe completar dirección y teléfono del cliente para enviar el pedido.');
        return;
      }
      if (!selectedCustomer.address.trim() || !selectedCustomer.phone.trim()) {
        setPedidoError('Debe completar dirección y teléfono del cliente para enviar el pedido.');
        return;
      }
    }
  }, [mode, selectedCustomer, deliveryType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{titles[mode]}</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <CustomerAutocomplete
            value={selectedCustomer ? selectedCustomer.name : client}
            onChange={val => { setClient(val); setSelectedCustomer(null); }}
            onSelect={c => { setSelectedCustomer(c); setClient(c.name); }}
          />
          {mode === 'pedido' && selectedCustomer && selectedCustomer.name !== 'Consumidor Final' && (
            <div className="text-xs mt-1 text-gray-600">{selectedCustomer.email && <span>Email: {selectedCustomer.email} | </span>}ID: {selectedCustomer.id}</div>
          )}
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Lista de precio</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedPriceList}
            onChange={e => setSelectedPriceList(e.target.value)}
          >
            {priceLists.map(pl => (
              <option key={pl.code} value={pl.code}>{pl.name || pl.code}</option>
            ))}
          </select>
        </div>

        {/* --- Tipo de entrega para pedidos --- */}
        {mode === 'pedido' && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Tipo de entrega <span className="text-red-600">*</span></label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1">
                <input type="radio" name="deliveryType" value="retiro" checked={deliveryType === 'retiro'} onChange={() => setDeliveryType('retiro')} />
                Retira por el negocio
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="deliveryType" value="envio" checked={deliveryType === 'envio'} onChange={() => setDeliveryType('envio')} />
                Enviar
              </label>
            </div>
          </div>
        )}

        {/* --- Si es envío, mostrar dirección y teléfono --- */}
        {mode === 'pedido' && deliveryType === 'envio' && selectedCustomer && selectedCustomer.name !== 'Consumidor Final' && (
          <div className="mb-3 border rounded p-2 bg-gray-50">
            <div className="mb-1 font-bold">Datos de envío del cliente</div>
            <div className="mb-1">Dirección: <span className={(!selectedCustomer.address || !selectedCustomer.address.trim()) ? 'text-red-600' : ''}>{selectedCustomer.address || 'No definida'}</span></div>
            <div className="mb-1">Teléfono: <span className={(!selectedCustomer.phone || !selectedCustomer.phone.trim()) ? 'text-red-600' : ''}>{selectedCustomer.phone || 'No definido'}</span></div>
            <button className="mt-2 px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={() => { setEditCustomerData(selectedCustomer); setEditCustomerOpen(true); }}>Editar datos del cliente</button>
          </div>
        )}

        {/* Modal edición cliente */}
        {editCustomerOpen && (
          <EditCustomerModal
            customer={editCustomerData}
            open={editCustomerOpen}
            onClose={() => setEditCustomerOpen(false)}
            onSave={async (data) => {
              setEditLoading(true);
              try {
                const updated = await customersService.updateCustomer(data.id, data);
                setSelectedCustomer(updated);
                setEditCustomerOpen(false);
              } catch (e) {
                alert('Error al guardar cliente');
              }
              setEditLoading(false);
            }}
          />
        )}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Tipo de descuento</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={discountType}
            onChange={e => setDiscountType(e.target.value)}
          >
            {discountTypes.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>
        {discountType !== 'none' && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              {discountType === 'percent' ? 'Porcentaje (%)' : 'Monto fijo'}
            </label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={discountValue}
              min={0}
              max={discountType === 'percent' ? 100 : total}
              onChange={e => setDiscountValue(Number(e.target.value))}
            />
          </div>
        )}
        {mode === 'cobrar' && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Pago en efectivo</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full"
                value={amountCash}
                min={0}
                max={finalTotal}
                onChange={e => {
                  setLastEdited('cash');
                  let val = Number(e.target.value);
                  if (isNaN(val) || val < 0) val = 0;
                  if (val > finalTotal) val = finalTotal;
                  setAmountCash(val);
                }}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Pago digital</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full"
                value={amountDigital}
                min={0}
                max={finalTotal}
                onChange={e => {
                  setLastEdited('digital');
                  let val = Number(e.target.value);
                  if (isNaN(val) || val < 0) val = 0;
                  if (val > finalTotal) val = finalTotal;
                  setAmountDigital(val);
                }}
              />
            </div>
            {amountDigital > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tipo digital</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={digitalType}
                  onChange={e => setDigitalType(e.target.value)}
                >
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
            )}
            {amountDigital > 0 && digitalType === 'tarjeta' && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Cuotas</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-full"
                  value={installments}
                  min={1}
                  max={36}
                  onChange={e => setInstallments(Number(e.target.value))}
                />
              </div>
            )}
            {!paymentValid && (
              <div className="mb-2 text-red-600 text-xs">La suma de efectivo y digital debe coincidir con el total a cobrar.</div>
            )}
          </>
        )}
        <div className="mb-2 font-bold text-right">
          Subtotal: {formatMoney(bruto)}
        </div>
        <div className="mb-2 font-bold text-right">
          Descuento por ítems: -{formatMoney(descuentoPorItems)}
        </div>
        <div className="mb-2 font-bold text-right">
          Descuento general: -{formatMoney(descuentoGeneral)}
        </div>
        <div className="mb-4 font-bold text-right text-blue-700">
          Total final: {formatMoney(finalTotal)}
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white font-bold"
            disabled={
              (mode === 'cobrar' && !paymentValid) ||
              (mode === 'pedido' && !!pedidoError)
            }
            onClick={async () => {
              setShowValidation(true);
              if (mode === 'pedido' && pedidoError) return;
              if (mode !== 'cobrar' || paymentValid) {
                await onConfirm(confirmData);
              }
            }}
          >
            {confirmLabels[mode]}
          </button>
        </div>
        {/* Mensaje de error de pedido */}
        {mode === 'pedido' && pedidoError && (
          <div className="mt-2 text-red-600 text-xs font-bold text-center">{pedidoError}</div>
        )}
      </div>
    </div>
  );
});
