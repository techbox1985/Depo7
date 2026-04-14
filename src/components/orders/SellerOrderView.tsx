import React, { useState, useMemo, useRef } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCartStore } from '../../store/useCartStore';
import { formatMoney } from '../../utils/money';
import CustomerAutocomplete from '../pventa/CustomerAutocomplete';
import { Button } from '../ui/Button';

const SellerOrderView: React.FC<{ onOrderCreated?: () => void }> = ({ onOrderCreated }) => {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerInput, setCustomerInput] = useState('');
  const { items, addItem, removeItem, updateQuantity, clearCart, subtotal, total } = useCartStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p.cod && p.cod.toLowerCase() === q) ||
      (p.name && p.name.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleAdd = (product: any) => {
    addItem(product, 'lista_1', 1, []);
    setSearch('');
    inputRef.current?.focus();
  };

  const handleConfirm = async () => {
    setError(null);
    if (!selectedCustomer) {
      setError('Selecciona un cliente');
      return;
    }
    if (!items.length) {
      setError('El carrito está vacío');
      return;
    }
    setSaving(true);
    try {
      await import('../../services/salesService').then(m => m.salesService.createSaleSupabase({
        items,
        total,
        customerId: selectedCustomer.id,
        sale_kind: 'pedido',
        estado: 'pendiente',
        cajaId: null,
      }));
      clearCart();
      setSuccess(true);
      if (onOrderCreated) onOrderCreated();
    } catch (e) {
      setError('Error al guardar el pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-50">
      {/* Productos */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex gap-2">
          <input
            ref={inputRef}
            className="border rounded px-3 py-2 w-full"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center text-gray-400">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">No se encontraron productos.</div>
          ) : filteredProducts.map(product => (
            <div key={product.id} className="border rounded-lg bg-white p-3 flex flex-col items-center">
              <img src={product.image_url || '/logo.png'} alt={product.name} className="h-24 w-24 object-cover mb-2 rounded" />
              <div className="font-bold text-gray-900 text-center mb-1">{product.name}</div>
              <div className="text-xs text-gray-500 mb-1">{product.rubro || '-'} · {product.marca || '-'}</div>
              <div className="text-lg font-bold text-indigo-700 mb-2">{formatMoney(product.price || product.price1 || 0)}</div>
              <Button size="sm" onClick={() => handleAdd(product)}>Agregar</Button>
            </div>
          ))}
        </div>
      </div>
      {/* Carrito y cliente */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold mb-2">Carrito</h2>
          {items.length === 0 ? (
            <div className="text-gray-400">Carrito vacío</div>
          ) : (
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Producto</th>
                  <th className="text-center p-2">Cant.</th>
                  <th className="text-right p-2">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.product?.id || idx} className="align-middle border-b last:border-b-0">
                    <td className="p-2 max-w-30 truncate">
                      <div className="font-medium truncate">{item.product?.cod || '-'} {item.product?.name || '-'}</div>
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button className="px-1 py-0.5 rounded bg-gray-200 hover:bg-gray-300" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                        <span className="min-w-4.5 text-center">{item.quantity}</span>
                        <button className="px-1 py-0.5 rounded bg-gray-200 hover:bg-gray-300" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                      </div>
                    </td>
                    <td className="p-2 text-right font-bold whitespace-nowrap">
                      <span className="inline-block min-w-14 text-right">{formatMoney(item.subtotal)}</span>
                    </td>
                    <td className="p-2 text-right">
                      <button className="text-red-500 hover:text-red-700 font-bold" onClick={() => removeItem(item.product.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold">Total:</span>
            <span className="text-lg font-bold text-indigo-700">{formatMoney(total)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold mb-2">Cliente</h2>
          <CustomerAutocomplete
            value={customerInput}
            onChange={setCustomerInput}
            onSelect={c => { setSelectedCustomer(c); setCustomerInput(c.name); }}
          />
          {selectedCustomer && (
            <div className="mt-2 text-xs text-gray-600">Cliente seleccionado: <span className="font-bold">{selectedCustomer.name}</span></div>
          )}
        </div>
        {error && <div className="text-red-600 text-sm font-bold">{error}</div>}
        {success && <div className="text-green-600 text-sm font-bold">Pedido enviado correctamente</div>}
        <Button variant="primary" className="w-full" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Enviando...' : 'Enviar pedido'}
        </Button>
      </div>
    </div>
  );
};

export default SellerOrderView;
