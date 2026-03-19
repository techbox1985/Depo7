import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Product, Supplier } from '../../types';
import { productsService } from '../../services/productsService';
import { suppliersService } from '../../services/suppliersService';
import { useProductsStore } from '../../store/useProductsStore';
import { Plus, Trash2, Search } from 'lucide-react';
import { formatMoney, roundMoney } from '../../utils/money';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProduct?: Product; // Optional initial product
}

interface PurchaseItemForm {
  id: string; // unique local id
  product: Product | null;
  quantity: number | '';
  unitPrice: number | '';
  totalPrice: number | '';
  expirationDate: string;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct
}) => {
  const { products } = useProductsStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState<PurchaseItemForm[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      product: initialProduct || null,
      quantity: '',
      unitPrice: '',
      totalPrice: '',
      expirationDate: ''
    }
  ]);
  
  const [paidCash, setPaidCash] = useState<number | ''>(0);
  const [paidDigital, setPaidDigital] = useState<number | ''>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    try {
      const data = await suppliersService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      setIsLoading(true);
      const newSupplier = await suppliersService.addSupplier(newSupplierName.trim());
      setSuppliers([...suppliers, newSupplier]);
      setSelectedSupplierId(newSupplier.id);
      setIsAddingSupplier(false);
      setNewSupplierName('');
    } catch (err: any) {
      setError(err.message || 'Error al agregar proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = useCallback(() => {
    return items.reduce((acc, item) => acc + roundMoney(Number(item.totalPrice) || 0), 0);
  }, [items]);

  const total = calculateTotal();
  const totalPaid = roundMoney((Number(paidCash) || 0) + (Number(paidDigital) || 0));
  const debt = roundMoney(total - totalPaid);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        product: null,
        quantity: '',
        unitPrice: '',
        totalPrice: '',
        expirationDate: ''
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof PurchaseItemForm, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Auto-calculate logic
      if (field === 'quantity' && updatedItem.unitPrice !== '') {
        updatedItem.totalPrice = roundMoney(Number(value) * Number(updatedItem.unitPrice));
      } else if (field === 'unitPrice' && updatedItem.quantity !== '') {
        updatedItem.totalPrice = roundMoney(Number(value) * Number(updatedItem.quantity));
      } else if (field === 'totalPrice' && updatedItem.quantity !== '' && Number(updatedItem.quantity) > 0) {
        updatedItem.unitPrice = roundMoney(Number(value) / Number(updatedItem.quantity));
      }
      
      return updatedItem;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedSupplierId && !isAddingSupplier) {
      setError('Debe seleccionar un proveedor');
      return;
    }
    
    const validItems = items.filter(item => item.product && item.quantity && item.unitPrice);
    if (validItems.length === 0) {
      setError('Debe agregar al menos un producto válido con cantidad y precio');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let supplierId = selectedSupplierId;
      let supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || '';
      
      if (isAddingSupplier && newSupplierName.trim()) {
        const newSupplier = await suppliersService.addSupplier(newSupplierName.trim());
        supplierId = newSupplier.id;
        supplierName = newSupplier.name;
      }

      await productsService.addPurchase({
        supplier_id: supplierId,
        supplier_name: supplierName,
        date: new Date(purchaseDate).toISOString(),
        paid_cash: roundMoney(Number(paidCash) || 0),
        paid_digital: roundMoney(Number(paidDigital) || 0),
        items: validItems.map(item => ({
          product_id: item.product!.id,
          product_name: item.product!.name,
          quantity: Math.round(Number(item.quantity)),
          price: roundMoney(Number(item.unitPrice)),
          expiration_date: item.expirationDate || null
        }))
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding purchase:', err);
      setError(err.message || 'Error al registrar la compra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Compra" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Proveedor</label>
            {isAddingSupplier ? (
              <div className="flex gap-2">
                <Input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Nombre del nuevo proveedor"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddSupplier} isLoading={isLoading}>
                  Guardar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setIsAddingSupplier(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={() => setIsAddingSupplier(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <Input
            label="Fecha de Compra"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Productos</h3>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Fila
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Cantidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">P. Unitario</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Subtotal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-40">Vencimiento</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <select
                        value={item.product?.id || ''}
                        onChange={(e) => {
                          const p = products.find(p => p.id === e.target.value);
                          handleItemChange(item.id, 'product', p || null);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      >
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.barcode || 'Sin código'})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.totalPrice}
                        onChange={(e) => handleItemChange(item.id, 'totalPrice', e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="date"
                        value={item.expirationDate}
                        onChange={(e) => handleItemChange(item.id, 'expirationDate', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length === 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Total de la Compra:</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(total)}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Pagado en Efectivo"
              type="number"
              min="0"
              step="1"
              value={paidCash}
              onChange={(e) => setPaidCash(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
            />
            <Input
              label="Pagado Digital / Transferencia"
              type="number"
              min="0"
              step="1"
              value={paidDigital}
              onChange={(e) => setPaidDigital(e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
            />
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Deuda Pendiente:</span>
            <span className={`text-lg font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatMoney(Math.max(0, debt))}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Registrar Compra
          </Button>
        </div>
      </form>
    </Modal>
  );
};
