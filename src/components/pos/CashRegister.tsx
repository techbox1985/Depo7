import React, { useEffect, useMemo, useState } from 'react';
import { useCashStore } from '../../store/useCashStore';
import { Button } from '../ui/Button';
import { CashModal } from './CashModal';
import { Wallet, Lock, Unlock } from 'lucide-react';
import { formatMoney } from '../../utils/money';
import { supabase } from '../../services/supabaseClient';
import { Spinner } from '../ui/Spinner';

type SaleRow = Record<string, any>;

type LiveSummary = {
  totalVentas: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalDebito: number;
  totalCredito: number;
  totalQr: number;
  totalOtros: number;
  totalDigital: number;
  cantidadVentas: number;
  ticketPromedio: number;
};

const normalizeNumber = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const getSaleDateRaw = (sale: SaleRow) => {
  return (
    sale.creado_en ||
    sale.fecha ||
    sale.created_at ||
    sale.date ||
    sale.sale_date ||
    null
  );
};

const getSaleDate = (sale: SaleRow) => {
  const raw = getSaleDateRaw(sale);
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getSaleStatus = (sale: SaleRow) => {
  return String(
    sale.estado ||
      sale.status ||
      ''
  ).toLowerCase();
};

const isCountableSale = (sale: SaleRow) => {
  const status = getSaleStatus(sale);
 return !['anulada', 'cancelada', 'cancelado', 'cancelled', 'presupuesto'].includes(status);
};

const resolvePaymentBucket = (sale: SaleRow) => {
  const raw = String(
    sale.payment_method ||
      sale.metodo_pago ||
      sale.medio_pago ||
      sale.forma_pago ||
      sale.tipo_pago ||
      sale.payment_type ||
      'otros'
  ).toLowerCase();

  if (raw.includes('efec')) return 'efectivo';
  if (raw.includes('trans')) return 'transferencia';
  if (raw.includes('debi')) return 'debito';
  if (raw.includes('credi')) return 'credito';
  if (raw.includes('qr')) return 'qr';
  if (
    raw.includes('digital') ||
    raw.includes('mercado pago') ||
    raw.includes('mercadopago') ||
    raw.includes('mp')
  ) {
    return 'otros-digital';
  }

  return 'otros';
};

export const CashRegister: React.FC = () => {
  const { currentSession } = useCashStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchCurrentSessionSales = async () => {
      if (!currentSession?.date_open) {
        setSales([]);
        return;
      }

      try {
        setLoadingSummary(true);

        const { data, error } = await supabase
          .from('sales')
          .select('*');

        if (error) {
          console.error('Error loading live cash summary:', error);
          setSales([]);
          return;
        }

        const allSales = (data as SaleRow[]) || [];
        const sessionOpen = new Date(currentSession.date_open);
        const sessionClose = currentSession.date_close
          ? new Date(currentSession.date_close)
          : null;

        const filtered = allSales.filter((sale) => {
          const saleDate = getSaleDate(sale);
          if (!saleDate) return false;

          if (sessionClose && !Number.isNaN(sessionClose.getTime())) {
            return saleDate >= sessionOpen && saleDate <= sessionClose;
          }

          return saleDate >= sessionOpen;
        });

        const sorted = [...filtered].sort((a, b) => {
          const aTime = getSaleDate(a)?.getTime() || 0;
          const bTime = getSaleDate(b)?.getTime() || 0;
          return bTime - aTime;
        });

        setSales(sorted);
      } catch (error) {
        console.error('Error loading live cash summary:', error);
        setSales([]);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchCurrentSessionSales();
  }, [currentSession]);

  const summary = useMemo<LiveSummary>(() => {
    const countableSales = sales.filter(isCountableSale);

    let totalVentas = 0;
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    let totalQr = 0;
    let totalOtros = 0;

    for (const sale of countableSales) {
      const total = normalizeNumber(
        sale.total ??
        sale.total_venta ??
        sale.importe ??
        sale.amount ??
        0
      );

      totalVentas += total;

      const bucket = resolvePaymentBucket(sale);

      if (bucket === 'efectivo') totalEfectivo += total;
      else if (bucket === 'transferencia') totalTransferencia += total;
      else if (bucket === 'debito') totalDebito += total;
      else if (bucket === 'credito') totalCredito += total;
      else if (bucket === 'qr') totalQr += total;
      else totalOtros += total;
    }

    const totalDigital =
      totalTransferencia + totalDebito + totalCredito + totalQr + totalOtros;

    const cantidadVentas = countableSales.length;
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    return {
      totalVentas,
      totalEfectivo,
      totalTransferencia,
      totalDebito,
      totalCredito,
      totalQr,
      totalOtros,
      totalDigital,
      cantidadVentas,
      ticketPromedio,
    };
  }, [sales]);

  const rows = [
    { label: 'Total ventas', value: summary.totalVentas, money: true, strong: true },
    { label: 'Cantidad de ventas', value: summary.cantidadVentas, money: false },
    { label: 'Ticket promedio', value: summary.ticketPromedio, money: true },
    { label: 'Efectivo', value: summary.totalEfectivo, money: true },
    { label: 'Digital total', value: summary.totalDigital, money: true },
    { label: 'Transferencia', value: summary.totalTransferencia, money: true },
    { label: 'Débito', value: summary.totalDebito, money: true },
    { label: 'Crédito', value: summary.totalCredito, money: true },
    { label: 'QR', value: summary.totalQr, money: true },
    { label: 'Otros', value: summary.totalOtros, money: true },
  ];

  return (
    <div className="flex flex-col h-full p-4 bg-white overflow-y-auto">
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={`p-4 rounded-full mb-3 ${
            currentSession ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Wallet className="h-10 w-10" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {currentSession ? 'Caja Abierta' : 'Caja Cerrada'}
        </h2>

        {currentSession ? (
          <div className="text-xs text-gray-600 mb-4 space-y-1">
            <p>
              Monto inicial:{' '}
              <span className="font-bold">
                {formatMoney(Number(currentSession.open_amount))}
              </span>
            </p>
            <p>Abierta el: {new Date(currentSession.date_open).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
            Debes abrir la caja para poder registrar cobros y ventas en el sistema.
          </p>
        )}

        <Button
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="w-full max-w-xs flex items-center justify-center gap-2"
          variant={currentSession ? 'secondary' : 'primary'}
        >
          {currentSession ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          {currentSession ? 'Cerrar Caja' : 'Abrir Caja'}
        </Button>
      </div>

      {currentSession && (
        <div className="mt-5 border-t border-gray-200 pt-4">
          {loadingSummary ? (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Resumen actual del turno
              </div>

              <div className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className={row.strong ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                      {row.label}
                    </span>

                    <span className={row.strong ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}>
                      {row.money ? formatMoney(Number(row.value)) : row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <CashModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={currentSession ? 'close' : 'open'}
        />
      )}
    </div>
  );
};