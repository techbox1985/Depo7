import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCashStore } from '../../store/useCashStore';
import { supabase } from '../../services/supabaseClient';
import { formatMoney, roundMoney } from '../../utils/money';

interface CashModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'open' | 'close';
  mandatory?: boolean;
}

export const CashModal: React.FC<CashModalProps> = ({ isOpen, onClose, type, mandatory = false }) => {
  const { openSession, closeSession, currentSession } = useCashStore();
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<any>({ 
    total_sales: 0, 
    total_products: 0, 
    sales_details: [],
    cantidad_ventas: 0,
    total_ventas: 0,
    cantidad_pedidos: 0,
    total_pedidos: 0,
    cantidad_presupuestos: 0,
    total_presupuestos: 0,
    cobrado_efectivo: 0,
    cobrado_digital: 0,
    cobrado_mercadopago: 0,
    cobrado_transferencia: 0,
    cobrado_tarjeta: 0,
    efectivo_esperado: 0
  });
  const [userId, setUserId] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email);
      } else {
        setUserId(undefined);
        setUserEmail(undefined);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (type === 'close' && currentSession) {
      const fetchSummary = async () => {
        const { data } = await supabase
          .from('sales')
          .select('*')
          .eq('caja_id', currentSession.id);
          
        if (data) {
          const completadas = data.filter((s: any) => s.estado === 'completada');
          const pendientes = data.filter((s: any) => s.estado === 'pendiente');
          const presupuestos = data.filter((s: any) => s.estado === 'presupuesto');

          const cantidad_ventas = completadas.length;
          const total_ventas = completadas.reduce((acc: number, sale: any) => acc + roundMoney(sale.total), 0);
          const cantidad_pedidos = pendientes.length;
          const total_pedidos = pendientes.reduce((acc: number, sale: any) => acc + roundMoney(sale.total), 0);
          const cantidad_presupuestos = presupuestos.length;
          const total_presupuestos = presupuestos.reduce((acc: number, sale: any) => acc + roundMoney(sale.total), 0);

          const cobrado_efectivo = completadas.reduce((acc: number, sale: any) => acc + roundMoney(sale.monto_efectivo || 0), 0);
          const cobrado_digital = completadas.reduce((acc: number, sale: any) => acc + roundMoney(sale.monto_digital || 0), 0);
          const cobrado_mercadopago = completadas.filter((s: any) => s.tipo_digital === 'mercadopago').reduce((acc: number, sale: any) => acc + roundMoney(sale.monto_digital || 0), 0);
          const cobrado_transferencia = completadas.filter((s: any) => s.tipo_digital === 'transferencia').reduce((acc: number, sale: any) => acc + roundMoney(sale.monto_digital || 0), 0);
          const cobrado_tarjeta = completadas.filter((s: any) => s.tipo_digital === 'tarjeta').reduce((acc: number, sale: any) => acc + roundMoney(sale.monto_digital || 0), 0);

          const efectivo_esperado = roundMoney(currentSession.open_amount) + cobrado_efectivo;
          const totalProducts = completadas.reduce((acc: number, sale: any) => acc + roundMoney(sale.total_productos || 0), 0);

          setSummary({ 
            total_sales: total_ventas, 
            total_products: totalProducts, 
            sales_details: data,
            cantidad_ventas,
            total_ventas,
            cantidad_pedidos,
            total_pedidos,
            cantidad_presupuestos,
            total_presupuestos,
            cobrado_efectivo,
            cobrado_digital,
            cobrado_mercadopago,
            cobrado_transferencia,
            cobrado_tarjeta,
            efectivo_esperado
          });
          setAmount(0);
        }
      };
      fetchSummary();
    } else {
      setAmount(0);
    }
  }, [type, currentSession, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (type === 'open') {
        await openSession(amount, userId);
      } else {
        const finalSummary = {
          ...summary,
          monto_real_caja: amount,
          diferencia_caja: amount - summary.efectivo_esperado
        };
        await closeSession(amount, finalSummary);
      }
      onClose();
    } catch (error) {
      console.error('Error handling cash session:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-medium text-gray-900">
              {type === 'open' ? 'Abrir Caja' : 'Cerrar Caja'}
            </h3>
            {!mandatory && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {type === 'open' && (
            <div className="mb-6 bg-indigo-50 p-4 rounded-lg space-y-2 text-sm text-indigo-900 border border-indigo-100">
              <div className="flex justify-between items-center">
                <span className="font-medium">Usuario:</span> 
                <span>{userEmail ? userEmail : 'Usuario Anónimo'}</span>
              </div>
              <p className="text-xs text-indigo-700 mt-2">
                Las ventas registradas en esta sesión quedarán asociadas a este usuario.
              </p>
            </div>
          )}

          {type === 'close' && (
            <div className="mb-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* SECCIÓN 1: RESUMEN COMERCIAL */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resumen Comercial</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ventas Completadas ({summary.cantidad_ventas}):</span>
                    <span className="font-medium text-gray-900">{formatMoney(summary.total_ventas)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pedidos Pendientes ({summary.cantidad_pedidos}):</span>
                    <span className="font-medium text-gray-900">{formatMoney(summary.total_pedidos)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Presupuestos ({summary.cantidad_presupuestos}):</span>
                    <span className="font-medium text-gray-900">{formatMoney(summary.total_presupuestos)}</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: RESUMEN DE COBROS */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">Resumen de Cobros</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700">Monto Inicial en Efectivo:</span>
                    <span className="font-medium text-indigo-900">{formatMoney(currentSession?.open_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700">Cobrado en Efectivo:</span>
                    <span className="font-medium text-green-600">+ {formatMoney(summary.cobrado_efectivo)}</span>
                  </div>
                  
                  <div className="border-t border-indigo-200 my-2 pt-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-700 font-medium">Total Digital:</span>
                    <span className="font-medium text-indigo-900">{formatMoney(summary.cobrado_digital)}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 text-xs">
                    <span className="text-indigo-600">Mercado Pago:</span>
                    <span className="text-indigo-800">{formatMoney(summary.cobrado_mercadopago)}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 text-xs">
                    <span className="text-indigo-600">Transferencia:</span>
                    <span className="text-indigo-800">{formatMoney(summary.cobrado_transferencia)}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 text-xs">
                    <span className="text-indigo-600">Tarjeta:</span>
                    <span className="text-indigo-800">{formatMoney(summary.cobrado_tarjeta)}</span>
                  </div>

                  <div className="border-t border-indigo-200 my-2 pt-2"></div>
                  
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-indigo-900">Total General Cobrado:</span>
                    <span className="text-indigo-900">{formatMoney(summary.cobrado_efectivo + summary.cobrado_digital)}</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: ARQUEO DE CAJA */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Arqueo de Caja (Físico)</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-800 font-medium">Efectivo Esperado:</span>
                    <span className="font-bold text-amber-900 text-lg">{formatMoney(summary.efectivo_esperado)}</span>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-amber-800 mb-1">
                      Monto Real Contado en Caja
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign className="h-4 w-4 text-amber-500" />
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={amount === 0 && summary.efectivo_esperado === 0 ? '' : amount}
                        onChange={(e) => setAmount(Math.round(parseFloat(e.target.value)) || 0)}
                        className="pl-9 font-bold text-lg border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {amount > 0 && (
                    <div className={`flex justify-between items-center p-2 rounded ${
                      amount === summary.efectivo_esperado ? 'bg-green-100 text-green-800' : 
                      amount > summary.efectivo_esperado ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="font-medium">Diferencia:</span>
                      <span className="font-bold">
                        {amount > summary.efectivo_esperado ? '+' : ''}{amount - summary.efectivo_esperado}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {type === 'open' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Inicial en Caja
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.round(parseFloat(e.target.value)) || 0)}
                  className="pl-10 text-lg font-medium"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!mandatory && (
              <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isProcessing}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleConfirm} isLoading={isProcessing} className="flex-1">
              {type === 'open' ? 'Abrir Caja' : 'Cerrar Caja'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

