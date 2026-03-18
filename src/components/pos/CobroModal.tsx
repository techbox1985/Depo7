import React, { useEffect, useMemo, useState } from 'react';
import { X, CreditCard, DollarSign, Percent, User, List } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { customersService, Customer } from '../../services/customersService';
import { useCart } from '../../hooks/useCart';
import { getEffectivePrice } from '../../utils/priceUtils';
import { usePromotionsStore } from '../../store/usePromotionsStore';

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'completada' | 'pendiente' | 'presupuesto';
  onConfirm: (
    customerId: string | undefined,
    options: {
      discountType: 'ninguno' | 'porcentaje' | 'fijo';
      discountValue: number;
      priceList: 'minorista' | 'mayorista' | 'carrito';
      paymentMethod: 'efectivo' | 'digital' | 'mixto';
      digitalType?: 'mercadopago' | 'transferencia' | 'tarjeta';
      installments?: number;
      amountCash?: number;
      amountDigital?: number;
    }
  ) => Promise<void>;
}

export const CobroModal: React.FC<CobroModalProps> = ({
  isOpen,
  onClose,
  status,
  onConfirm,
}) => {
  const { items, total: cartTotal, globalPriceList } = useCart();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [customerId, setCustomerId] = useState<string>('');
  const [priceList, setPriceList] = useState<'minorista' | 'mayorista' | 'carrito'>('carrito');

  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'digital' | 'mixto'>('efectivo');
  const [digitalType, setDigitalType] = useState<'mercadopago' | 'transferencia' | 'tarjeta'>('mercadopago');
  const [installments, setInstallments] = useState<1 | 3 | 6>(1);

  const [discountType, setDiscountType] = useState<'ninguno' | 'porcentaje' | 'fijo'>('ninguno');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [amountCash, setAmountCash] = useState<number>(0);
  const [amountDigital, setAmountDigital] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingCustomers(true);

    customersService
      .getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setIsLoadingCustomers(false));

    setCustomerId('');
    setPriceList('carrito');
    setPaymentMethod('efectivo');
    setDigitalType('mercadopago');
    setInstallments(1);
    setDiscountType('ninguno');
    setDiscountValue(0);
    setAmountCash(0);
    setAmountDigital(0);
  }, [isOpen]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCustomerId = e.target.value;
    setCustomerId(newCustomerId);

    if (!newCustomerId) {
      setPriceList('carrito');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === newCustomerId);

    if (selectedCustomer && selectedCustomer.default_price_list) {
      setPriceList(selectedCustomer.default_price_list as 'minorista' | 'mayorista');
    } else {
      setPriceList('carrito');
    }
  };

  const { promotions } = usePromotionsStore();

  const baseTotal = useMemo(() => {
    if (priceList === 'carrito') return Math.round(cartTotal);

    const total = items.reduce((acc, item) => {
      const baseUnitPrice = getEffectivePrice(item.product, priceList as 'minorista' | 'mayorista', promotions);

      let lineDiscountAmount = 0;
      const normalizedType =
        item.discountType === 'percent' || item.discountType === 'porcentaje'
          ? 'percent'
          : item.discountType === 'amount' || item.discountType === 'fijo'
            ? 'amount'
            : 'none';

      const safeDiscountValue = Math.round(Number(item.discountValue || 0));

      if (normalizedType === 'percent' && safeDiscountValue > 0) {
        lineDiscountAmount = baseUnitPrice * (safeDiscountValue / 100);
      } else if (normalizedType === 'amount' && safeDiscountValue > 0) {
        lineDiscountAmount = safeDiscountValue;
      }

      const finalUnitPrice = Math.max(0, baseUnitPrice - lineDiscountAmount);
      return acc + finalUnitPrice * item.quantity;
    }, 0);

    return Math.round(total);
  }, [items, cartTotal, priceList]);

  const finalTotal = useMemo(() => {
    let total = baseTotal;

    if (discountType === 'porcentaje') {
      total = baseTotal * (1 - discountValue / 100);
    } else if (discountType === 'fijo') {
      total = Math.max(0, baseTotal - discountValue);
    }

    return Math.round(total);
  }, [baseTotal, discountType, discountValue]);

  useEffect(() => {
    if (paymentMethod === 'efectivo') {
      setAmountCash(finalTotal);
      setAmountDigital(0);
    } else if (paymentMethod === 'digital') {
      setAmountCash(0);
      setAmountDigital(finalTotal);
    } else if (paymentMethod === 'mixto') {
      setAmountDigital(Math.max(0, Math.round(finalTotal - amountCash)));
    }
  }, [paymentMethod, finalTotal]);

  useEffect(() => {
    if (paymentMethod === 'mixto') {
      setAmountDigital(Math.max(0, Math.round(finalTotal - amountCash)));
    }
  }, [amountCash, finalTotal, paymentMethod]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);

      await onConfirm(customerId || undefined, {
        discountType,
        discountValue,
        priceList,
        paymentMethod,
        digitalType: paymentMethod !== 'efectivo' ? digitalType : undefined,
        installments: paymentMethod !== 'efectivo' && digitalType === 'tarjeta' ? installments : 1,
        amountCash:
          paymentMethod === 'efectivo'
            ? finalTotal
            : paymentMethod === 'mixto'
              ? amountCash
              : 0,
        amountDigital:
          paymentMethod === 'digital'
            ? finalTotal
            : paymentMethod === 'mixto'
              ? amountDigital
              : 0,
      });

      onClose();
    } catch (error) {
      console.error('Error in CobroModal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCompleted = status === 'completada';
  const title =
    status === 'completada'
      ? 'Cobrar Venta'
      : status === 'pendiente'
        ? 'Registrar Pedido'
        : 'Crear Presupuesto';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold leading-6 text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-gray-100 p-1 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" /> Cliente
                  </label>
                  <select
                    value={customerId}
                    onChange={handleCustomerChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={isLoadingCustomers}
                  >
                    <option value="">Consumidor Final</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                    <List className="h-4 w-4" /> Lista de Precios
                  </label>
                  <select
                    value={priceList}
                    onChange={(e) =>
                      setPriceList(e.target.value as 'minorista' | 'mayorista' | 'carrito')
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="carrito">
                      Según carrito ({globalPriceList === 'carrito' ? 'Mixto' : globalPriceList})
                    </option>
                    <option value="minorista">Forzar Minorista</option>
                    <option value="mayorista">Forzar Mayorista</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Descuento General</label>

                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('ninguno');
                      setDiscountValue(0);
                    }}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                      discountType === 'ninguno'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Ninguno
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('porcentaje')}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                      discountType === 'porcentaje'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Porcentaje (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('fijo')}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                      discountType === 'fijo'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Monto Fijo ($)
                  </button>
                </div>

                {discountType !== 'ninguno' && (
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      {discountType === 'porcentaje' ? (
                        <Percent className="h-4 w-4 text-gray-400" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    <Input
                      type="number"
                      min="0"
                      step={discountType === 'porcentaje' ? '1' : '0.01'}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="pl-10"
                      placeholder={discountType === 'porcentaje' ? 'Ej: 10' : 'Ej: 500'}
                    />
                  </div>
                )}
              </div>

              {isCompleted && (
                <div className="space-y-4">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4" /> Método de Pago
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`rounded-md border py-2 text-sm font-medium ${
                        paymentMethod === 'efectivo'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      Efectivo
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('digital')}
                      className={`rounded-md border py-2 text-sm font-medium ${
                        paymentMethod === 'digital'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      Digital
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mixto')}
                      className={`rounded-md border py-2 text-sm font-medium ${
                        paymentMethod === 'mixto'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      Mixto
                    </button>
                  </div>

                  {(paymentMethod === 'digital' || paymentMethod === 'mixto') && (
                    <div className="mt-3 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Tipo de pago digital
                        </label>
                        <select
                          value={digitalType}
                          onChange={(e) =>
                            setDigitalType(
                              e.target.value as 'mercadopago' | 'transferencia' | 'tarjeta'
                            )
                          }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="mercadopago">Mercado Pago</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="tarjeta">Tarjeta</option>
                        </select>
                      </div>

                      {digitalType === 'tarjeta' && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Cuotas
                          </label>
                          <div className="flex gap-2">
                            {[1, 3, 6].map((cuota) => (
                              <button
                                key={cuota}
                                type="button"
                                onClick={() => setInstallments(cuota as 1 | 3 | 6)}
                                className={`flex-1 rounded-md border py-1.5 text-sm font-medium ${
                                  installments === cuota
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-700'
                                }`}
                              >
                                {cuota}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'mixto' && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Monto Efectivo
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountCash || ''}
                            onChange={(e) => setAmountCash(parseFloat(e.target.value) || 0)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Monto Digital
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            type="number"
                            value={amountDigital}
                            disabled
                            className="bg-gray-50 pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-gray-900 p-4 text-white">
                <span className="text-lg font-medium">Total a Pagar</span>
                <div className="text-right">
                  {discountType !== 'ninguno' && (
                    <div className="mb-1 text-sm text-gray-400 line-through">
                      ${baseTotal}
                    </div>
                  )}
                  <span className="text-3xl font-bold">${finalTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              type="button"
              onClick={handleConfirm}
              isLoading={isProcessing}
              className="w-full sm:ml-3 sm:w-auto"
            >
              Confirmar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isProcessing}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};