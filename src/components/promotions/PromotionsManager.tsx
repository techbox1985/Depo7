import React, { useState } from 'react';
import { usePromotions } from '../../hooks/usePromotions';
import { Promotion } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Tag, Percent } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

export const PromotionsManager: React.FC = () => {
  const { promotions, isLoading, error, addPromotion, updatePromotion } = usePromotions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    type: 'percentage',
    discount_percentage: 0,
    applies_to: 'global',
    target_value: '',
  });

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
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, formData);
      } else {
        await addPromotion(formData as Omit<Promotion, 'id' | 'created_at' | 'updated_at'>);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            required
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Descuento (%)"
              type="number"
              required
              min="0"
              max="100"
              value={formData.discount_percentage || 0}
              onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aplica a</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.applies_to || 'global'}
                onChange={(e) => setFormData({ ...formData, applies_to: e.target.value, target_value: '' })}
              >
                <option value="global">Global (Todos los productos)</option>
                <option value="rubro">Rubro específico</option>
                <option value="producto">Producto específico</option>
              </select>
            </div>
            
            {formData.applies_to !== 'global' && (
              <Input
                label={formData.applies_to === 'rubro' ? 'Nombre del Rubro' : 'ID del Producto'}
                required
                value={formData.target_value || ''}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingPromotion ? 'Guardar Cambios' : 'Agregar Promoción'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
