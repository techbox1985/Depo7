import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Printer } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { formatMoney } from '../../utils/money';

type CashClosingRow = {
  id: string;
  date_open: string;
  date_close: string | null;
  open_amount: number;
  close_amount: number | null;
  total_ventas: number | null;
  diferencia_caja: number | null;
  user_id: string | null;
};

export const CashClosures: React.FC = () => {
  const [closures, setClosures] = useState<CashClosingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleReprint = (closure: CashClosingRow) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Cierre de Caja</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ticket de Cierre de Caja</h1>
            <p>Fecha: ${new Date(closure.date_open).toLocaleString()}</p>
          </div>
          <p>Total Ventas: ${formatMoney(closure.total_ventas || 0)}</p>
          <p>Declarado: ${formatMoney(closure.close_amount || 0)}</p>
          <p>Diferencia: ${formatMoney(closure.diferencia_caja || 0)}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const fetchClosures = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_closings')
        .select('*')
        .order('date_open', { ascending: false });

      if (error) {
        console.error('Error loading cash closures:', error);
      } else {
        setClosures(data || []);
      }
      setLoading(false);
    };

    fetchClosures();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cierres de Caja</h1>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3">Apertura</th>
              <th className="px-6 py-3">Cierre</th>
              <th className="px-6 py-3 text-right">Total Ventas</th>
              <th className="px-6 py-3 text-right">Declarado</th>
              <th className="px-6 py-3 text-right">Diferencia</th>
              <th className="px-6 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {closures.map((closure) => (
              <tr key={closure.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {new Date(closure.date_open).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {closure.date_close ? new Date(closure.date_close).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                  {formatMoney(closure.total_ventas || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                  {formatMoney(closure.close_amount || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                  {formatMoney(closure.diferencia_caja || 0)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleReprint(closure)}
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    title="Reimprimir ticket de cierre"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
