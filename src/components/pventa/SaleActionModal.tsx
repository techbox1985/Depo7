import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { formatMoney } from '../../utils/money';
import CustomerAutocomplete from './CustomerAutocomplete';
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
  total,
  priceList,
  client: initialClient,
}, ref) => {
  // Cliente
  const [client, setClient] = useState(initialClient || 'Consumidor Final');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  // Lista de precios
  const { priceLists } = usePriceLists();
  const [selectedPriceList, setSelectedPriceList] = useState(priceList || 'lista_1');
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

  // Calcular total con descuento
  let discountAmount = 0;
  if (discountType === 'percent') discountAmount = total * (discountValue / 100);
  if (discountType === 'fixed') discountAmount = discountValue;
  const finalTotal = Math.max(0, total - discountAmount);

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
    items,
    total: finalTotal,
    paymentMethod: amountCash > 0 && amountDigital > 0 ? 'mixto' : (amountCash > 0 ? 'efectivo' : 'digital'),
    amountCash,
    amountDigital,
    digitalType: amountDigital > 0 ? digitalType : undefined,
    installments: amountDigital > 0 && digitalType === 'tarjeta' ? installments : undefined,
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
    cobrar: 'Confirmar',
    presupuesto: 'Confirmar presupuesto',
    pedido: 'Confirmar pedido',
  };

  useEffect(() => {
    // Si cambia el total, resetear montos
    setAmountCash(finalTotal);
    setAmountDigital(0);
  }, [finalTotal, open]);

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
                onChange={e => setAmountCash(Number(e.target.value))}
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
                onChange={e => setAmountDigital(Number(e.target.value))}
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
        <div className="mb-4 font-bold text-right">
          Total: {formatMoney(finalTotal)}
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white font-bold"
            disabled={mode === 'cobrar' && !paymentValid}
            onClick={() => {
              setShowValidation(true);
              if (mode !== 'cobrar' || paymentValid) onConfirm(confirmData);
            }}
          >
            {confirmLabels[mode]}
          </button>
        </div>
      </div>
    </div>
  );
});
