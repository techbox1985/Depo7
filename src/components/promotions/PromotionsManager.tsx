import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { usePromotions } from '../../hooks/usePromotions';
import { Promotion } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Tag, Percent, Trash2 } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export const PromotionsManager: React.FC = () => {
  const { promotions, isLoading, error, addPromotion, updatePromotion, deletePromotion } = usePromotions();
  const { products } = useProducts();
  const rubros = Array.from(new Set(products.map(p => p.rubro).filter((r): r is string => !!r)));
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    type: 'percentage',
    vigencia_type: 'date',
    applies_to: 'global',
    applies_to_price_list: 'all',
    target_value: '',
    start_date: null,
    end_date: null,
    promo_stock_limit: 0,
    promo_stock_sold: 0,
  });
  
  const handleDelete = async (id: string) => {
    console.log("HANDLE DELETE PROMO", id);
    if (!id) {
      console.log("DELETE PROMO EARLY RETURN: missing id");
      return;
    }
    try {
      console.log("CALL STORE DELETE PROMO", id);
      await deletePromotion(id);
      console.log("POST DELETE UI REFRESH", id);
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
      alert('Error al eliminar la promoción: ' + JSON.stringify(error));
    }
  };
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === formData.target_value);

  const handleProductSelect = (productId: string) => {
    setFormData({ ...formData, target_value: productId });
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromotion(promo);
      setFormData(promo);
    } else {
      setEditingPromotion(undefined);
      setFormData({
        name: '',
        type: 'percentage',
        discount_percentage: 0,
        applies_to: 'global',
        target_value: '',
        start_date: null,
        end_date: null,
        promo_stock_limit: 0,
        promo_stock_sold: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar datos finales
    const finalData = { ...formData };
    
    // Forzar alcance a producto si es stock limitado
    if (finalData.vigencia_type === 'stock') {
      finalData.applies_to = 'producto';
    }

    if (finalData.applies_to === 'global') {
      finalData.target_value = null;
    }

    console.log("PROMO SUBMIT VALIDATION STATE", {
      vigencia_type: finalData.vigencia_type,
      applies_to: finalData.applies_to,
      target_value: finalData.target_value,
      promo_stock_limit: finalData.promo_stock_limit,
      formData
    });

    // Validaciones
    if (finalData.vigencia_type === 'date') {
      if (finalData.start_date && finalData.end_date && new Date(finalData.end_date) < new Date(finalData.start_date)) {
        alert('La fecha fin no puede ser menor a la fecha inicio');
        return;
      }
      if (finalData.applies_to === 'rubro' && !finalData.target_value) {
        alert('Debe seleccionar un rubro');
        return;
      }
      if (finalData.applies_to === 'producto' && !finalData.target_value) {
        alert('Debe seleccionar un producto');
        return;
      }
    } else if (finalData.vigencia_type === 'stock') {
      if (!finalData.target_value || Number(finalData.promo_stock_limit) <= 0) {
        alert('Para stock limitado, debe seleccionar un producto y definir una cantidad mayor a 0');
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, finalData);
      } else {
        await addPromotion(finalData as Omit<Promotion, 'id' | 'created_at' | 'updated_at'>);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al guardar promoción:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && promotions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Promociones</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Promoción
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-gray-900">{promo.name}</h3>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-sm text-gray-600">
              <p className="flex items-center">
                <span className="font-medium text-gray-900 mr-2">Descuento:</span>
                <span className="flex items-center text-green-600 font-bold">
                  {promo.discount_percentage}% <Percent className="h-3 w-3 ml-1" />
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-900 mr-2">Aplica a:</span>
                <span className="capitalize">{promo.applies_to}</span>
                {promo.target_value && ` (${promo.target_value})`}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
              <Button variant="secondary" size="sm" onClick={() => handleOpenModal(promo)}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("CLICK ELIMINAR PROMO", promo.id);
                  handleDelete(promo.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        ))}
        
        {promotions.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Sin promociones</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva promoción.</p>
            <Button className="mt-4" onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Promoción
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPromotion ? 'Editar Promoción' : 'Agregar Promoción'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Nombre" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Tipo de vigencia</label>
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant={formData.vigencia_type === 'date' ? 'primary' : 'secondary'} onClick={() => setFormData({ ...formData, vigencia_type: 'date' })}>Hasta fecha límite</Button>
              <Button type="button" variant={formData.vigencia_type === 'stock' ? 'primary' : 'secondary'} onClick={() => setFormData({ ...formData, vigencia_type: 'stock' })}>Hasta agotar stock</Button>
            </div>
            
            {formData.vigencia_type === 'date' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Fecha Inicio" type="date" value={formData.start_date || ''} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                  <Input label="Fecha Fin" type="date" value={formData.end_date || ''} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alcance</label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm" value={formData.applies_to || 'global'} onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any, target_value: '' })}>
                    <option value="global">Global</option>
                    <option value="rubro">Rubro específico</option>
                    <option value="producto">Producto específico</option>
                  </select>
                </div>

                {formData.applies_to === 'rubro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                    <select className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm" value={formData.target_value || ''} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}>
                      <option value="">Seleccione un rubro</option>
                      {rubros.map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
                    </select>
                  </div>
                )}

                {formData.applies_to === 'producto' && (
                  <div className="relative">
                    <Input label="Buscar producto" value={selectedProduct ? selectedProduct.name : searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} />
                    {showSuggestions && searchTerm && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-auto rounded-md shadow-lg">
                        {filteredProducts.map(p => <li key={p.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleProductSelect(p.id)}>{p.name} ({p.barcode})</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {formData.vigencia_type === 'stock' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="relative">
                  <Input label="Producto" value={selectedProduct ? `${selectedProduct.name} (Stock: ${selectedProduct.stock})` : searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} />
                  {showSuggestions && searchTerm && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-auto rounded-md shadow-lg">
                      {filteredProducts.map(p => <li key={p.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleProductSelect(p.id)}>{p.name} (Stock: {p.stock})</li>)}
                    </ul>
                  )}
                </div>
                <Input label="Cantidad límite promocional" type="number" value={formData.promo_stock_limit || 0} onChange={(e) => setFormData({ ...formData, promo_stock_limit: parseInt(e.target.value) })} />
              </div>
            )}
          </div>

          <Input label="Descuento (%)" type="number" required min="0" max="100" value={formData.discount_percentage || 0} onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lista de precio</label>
            <select className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm" value={formData.applies_to_price_list || 'all'} onChange={(e) => setFormData({ ...formData, applies_to_price_list: e.target.value as any })}>
              <option value="all">Todas las listas</option>
              <option value="lista_1">Lista 1</option>
              <option value="lista_2">Lista 2</option>
              <option value="lista_3">Lista 3</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};