import { getBasePrice } from '../../utils/priceUtils';
import RightPanelTabs from './RightPanelTabs';
import CartPanel from './CartPanel';
import SalesPanel from './SalesPanel';
import CashPanel from './CashPanel';
import React, { useState, useMemo, useRef } from 'react';
import type { Product } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/useCartStore';
import { useCashStore } from '../../store/useCashStore';
import OpenCashModal from './OpenCashModal';
import { useQueuedSalesStore } from '../../store/useQueuedSalesStore';
import { SaleActionModal, SaleActionMode } from './SaleActionModal';
import QueuedSalesList from './QueuedSalesList';
import { formatMoney } from '../../utils/money';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { usePriceLists } from '../../hooks/usePriceLists';
import { useOfflineSalesStore } from '../../store/useOfflineSalesStore';

const PVenta: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const { priceLists } = usePriceLists();
  const [selectedPriceList, setSelectedPriceList] = useState<'lista_1' | 'lista_2' | 'lista_3'>('lista_1');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const { currentSession, fetchCurrentSession, openSession, closeSession } = useCashStore();
  const { queuedSales, addSale, removeSale, getSale } = useQueuedSalesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SaleActionMode>('cobrar');
  const modalRef = useRef<any>(null);
  const [lastAction, setLastAction] = useState<any>(null); // para demo/confirmación
  // Offline sales store
  const { addSale: addOfflineSale } = useOfflineSalesStore();
  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    // Prioridad: código exacto > nombre incluye
    return products.filter(p =>
      (p.cod && p.cod.toLowerCase() === q) ||
      (p.name && p.name.toLowerCase().includes(q))
    );
  }, [products, search]);

  // Agregado centralizado
  const handleAdd = (product: Product) => {
    addItem(product, selectedPriceList, 1, []);
    setSearch('');
    inputRef.current?.focus();
  };

  // Enter directo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = search.trim().toLowerCase();
      let prod = products.find(p => p.cod && p.cod.toLowerCase() === q);
      if (!prod && filteredProducts.length > 0) prod = filteredProducts[0];
      if (prod) handleAdd(prod);
    }
  };

  // Total calculado
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Handler para poner en cola
  const handleQueueSale = () => {
    if (!items.length) return;
    addSale({
      items: [...items],
      total,
      // TODO: agregar cliente, lista de precio, descuento, tipo de operación si aplica
    });
    clearCart();
  };

  // Handler para retomar venta en cola
  const handleResumeSale = (id: string) => {
    const sale = getSale(id);
    if (!sale) return;
    // Cargar carrito con los datos de la venta en cola
    // Solo items y total por ahora, se puede expandir
    clearCart();
    sale.items.forEach(item => {
      addItem(item.product, item.priceType, item.quantity, []);
    });
    removeSale(id);
  };

  // Refrescar caja al montar
  React.useEffect(() => {
    fetchCurrentSession();
  }, []);

  // Atajos globales para acciones principales
  // F2: Cobrar (ya estaba)
  // F3: En cola
  // F4: Pedido
  // F5: Presupuestar
  useKeyboardShortcuts([
    {
      key: 'F2',
      callback: () => {
        if (!modalOpen && currentSession) {
          setModalMode('cobrar');
          setModalOpen(true);
        } else if (modalRef.current && typeof modalRef.current.confirm === 'function') {
          modalRef.current.confirm();
        }
      },
    },
    {
      key: 'F3',
      callback: () => {
        if (!modalOpen && currentSession) {
          handleQueueSale();
        }
      },
    },
    {
      key: 'F4',
      callback: () => {
        if (!modalOpen && currentSession) {
          setModalMode('pedido');
          setModalOpen(true);
        }
      },
    },
    {
      key: 'F5',
      callback: () => {
        if (!modalOpen && currentSession) {
          setModalMode('presupuesto');
          setModalOpen(true);
        }
      },
    },
  ]);

  return (
    <div className="flex h-[90vh] w-full">
      {/* Izquierda: productos */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Indicador de caja */}
        <div className="mb-2">
          {currentSession ? (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Caja abierta</span>
          ) : (
            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Caja cerrada</span>
          )}
        </div>
        {!currentSession && (
          <OpenCashModal onOpen={async (amount) => {
            await openSession(amount);
            await fetchCurrentSession();
          }} />
        )}
        <h1 className="text-2xl font-bold mb-4">P.Venta</h1>
        <div className="flex gap-2 mb-4">
          {/* Si no hay caja, bloquear input de venta */}
          <input
            ref={inputRef}
            className="border rounded px-3 py-2 w-full"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={!currentSession}
          />
          <select
            className="border rounded px-2 py-2"
            value={selectedPriceList}
            onChange={e => setSelectedPriceList(e.target.value as 'lista_1' | 'lista_2' | 'lista_3')}
            disabled={!currentSession}
          >
            {priceLists.map(pl => (
              <option key={pl.code} value={pl.code as 'lista_1' | 'lista_2' | 'lista_3'}>{pl.name || pl.code}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-auto border rounded p-2 bg-white">
          {isLoading ? (
            <div>Cargando productos...</div>
          ) : !currentSession ? (
            <div className="text-gray-400 text-center mt-8">Debes abrir una caja para operar.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-right p-2">Precio</th>
                  <th className="text-right p-2">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => (
                  <tr key={prod.id}>
                    <td className="p-2">{prod.cod}</td>
                    <td className="p-2">{prod.name}</td>
                    <td className="p-2 text-right font-bold">{formatMoney(getBasePrice(prod, selectedPriceList))}</td>
                    <td className="p-2 text-right">{prod.stock ?? '-'}</td>
                    <td className="p-2 text-right">
                      <button
                        className="bg-indigo-600 text-white rounded px-2 py-1 hover:bg-indigo-700"
                        onClick={() => handleAdd(prod)}
                        disabled={!currentSession}
                      >Agregar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Eliminado bloque debug última acción */}
      </div>
      {/* Panel derecho con tabs */}
      <div className="w-96 border-l p-6 bg-gray-50 flex flex-col">
        <RightPanelTabs
          CartPanel={() => (
            <CartPanel
              setModalMode={setModalMode}
              setModalOpen={setModalOpen}
              handleQueueSale={handleQueueSale}
              handleResumeSale={handleResumeSale}
              modalRef={modalRef}
              selectedPriceList={selectedPriceList}
              selectedCustomer={selectedCustomer}
            />
          )}
          SalesPanel={SalesPanel}
          CashPanel={CashPanel}
        />
        {/* Modal de acción final */}
        <SaleActionModal
          ref={modalRef}
          open={modalOpen}
          mode={modalMode}
          onClose={() => setModalOpen(false)}
          onConfirm={async data => {
            setLastAction(data);
            setModalOpen(false);
            if (data.priceList) setSelectedPriceList(data.priceList);
            if (data.customerId) setSelectedCustomer(data.customerId);
            // Diagnóstico: caja_id puede llegar null si currentSession no está actualizado o no existe
            // Corrección: abortar venta si no hay caja abierta
            if (!currentSession?.id) {
              alert('No hay caja/turno abierto. No se puede guardar la venta.');
              return;
            }
            try {

// Atajos globales para acciones principales
// F2: Cobrar (ya estaba)
// F3: En cola
// F4: Pedido
// F5: Presupuestar
// Debe ir dentro del componente y antes del return

// --- INICIO ATJOS ---
useKeyboardShortcuts([
  {
    key: 'F2',
    callback: () => {
      if (!modalOpen && currentSession) {
        setModalMode('cobrar');
        setModalOpen(true);
      } else if (modalRef.current && typeof modalRef.current.confirm === 'function') {
        modalRef.current.confirm();
      }
    },
  },
  {
    key: 'F3',
    callback: () => {
      if (!modalOpen && currentSession) {
        handleQueueSale();
      }
    },
  },
  {
    key: 'F4',
    callback: () => {
      if (!modalOpen && currentSession) {
        setModalMode('pedido');
        setModalOpen(true);
      }
    },
  },
  {
    key: 'F5',
    callback: () => {
      if (!modalOpen && currentSession) {
        setModalMode('presupuesto');
        setModalOpen(true);
      }
    },
  },
]);
// --- FIN ATJOS ---
              // Siempre pasar caja_id real
              const sale = await import('../../services/salesService').then(m => m.salesService.createSaleSupabase(
                data.items,
                data.total,
                data.customerId,
                'completada',
                currentSession.id // nunca null
              ));
              clearCart();
              // @ts-ignore
              if ((window as any).reloadSalesHistory) (window as any).reloadSalesHistory();
            } catch (err) {
              await addOfflineSale({
                ...data,
                fecha: new Date().toISOString(),
                caja_id: currentSession.id,
              });
            }
          }}
          items={items}
          total={total}
          priceList={selectedPriceList}
          client={selectedCustomer ?? undefined}
        />
      </div>
    </div>
  );
};

export default PVenta;
