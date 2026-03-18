import React, { useEffect, useState } from 'react';
import { priceListsService } from '../../services/priceListsService';
import { PriceList } from '../../types';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Edit2, RefreshCw, CheckCircle, XCircle, Plus } from 'lucide-react';

type CreateFormState = {
  name: string;
  code: string;
  margin_percent: number;
  active: boolean;
  sort_order: number;
};

const initialCreateForm: CreateFormState = {
  name: '',
  code: '',
  margin_percent: 0,
  active: true,
  sort_order: 0,
};

export const PriceListsView: React.FC = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMargin, setEditMargin] = useState<number>(0);

  const [isRecalculating, setIsRecalculating] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(initialCreateForm);
  const [confirmingList, setConfirmingList] = useState<PriceList | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const fetchLists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const lists = await priceListsService.getPriceLists();
      setPriceLists(lists);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar las listas de precios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleEditClick = (list: PriceList) => {
    setEditingId(list.id);
    setEditMargin(Number(list.margin_percent || 0));
  };

  const handleSaveMargin = async (list: PriceList) => {
    try {
      if (!Number.isFinite(editMargin) || editMargin < 0) {
        showError('El margen debe ser un número mayor o igual a 0.');
        return;
      }

      await priceListsService.updatePriceListMargin(list.id, editMargin);
      const result = await priceListsService.recalculatePriceList(list.code, editMargin);

      setEditingId(null);
      await fetchLists();

      showSuccess(
        `Margen actualizado. Lista ${list.name} recalculada correctamente. Productos actualizados: ${result.updated_products}`
      );
    } catch (err: any) {
      console.error('Error guardando margen/recalculando lista:', err);
      showError('Error al guardar: ' + (err?.message || 'Error desconocido'));
    }
  };

  const handleRecalculateClick = (list: PriceList) => {
    setConfirmingList(list);
  };

  const confirmRecalculate = async () => {
    if (!confirmingList) return;
    const list = confirmingList;
    setConfirmingList(null);

    try {
      setIsRecalculating(list.code);

      const result = await priceListsService.recalculatePriceList(
        list.code,
        Number(list.margin_percent || 0)
      );

      await fetchLists();

      showSuccess(
        `Lista ${list.name} recalculada exitosamente. Productos actualizados: ${result.updated_products}`
      );
    } catch (err: any) {
      console.error('Error al recalcular:', err);
      showError('Error al recalcular: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsRecalculating(null);
    }
  };

  const handleCreateList = async () => {
    try {
      const name = createForm.name.trim();
      const code = createForm.code.trim().toLowerCase();

      if (!name) {
        showError('El nombre de la lista es obligatorio.');
        return;
      }

      if (!code) {
        showError('El código de la lista es obligatorio.');
        return;
      }

      if (!/^[a-z0-9_-]+$/.test(code)) {
        showError('El código solo puede contener letras minúsculas, números, guiones o guiones bajos.');
        return;
      }

      if (!Number.isFinite(createForm.margin_percent) || createForm.margin_percent < 0) {
        showError('El margen debe ser un número mayor o igual a 0.');
        return;
      }

      setIsCreating(true);

      await priceListsService.createPriceList({
        name,
        code,
        margin_percent: Number(createForm.margin_percent || 0),
        active: createForm.active,
        sort_order:
          Number.isFinite(createForm.sort_order) && createForm.sort_order > 0
            ? Number(createForm.sort_order)
            : priceLists.length + 1,
      });

      setCreateForm(initialCreateForm);
      setShowCreateForm(false);
      await fetchLists();

      showSuccess(`Lista ${name} creada correctamente.`);
    } catch (err: any) {
      console.error('Error al crear lista:', err);
      showError('Error al crear lista: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Listas de Precios</h2>

        <Button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? 'Cerrar' : 'Agregar Lista'}
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Nueva lista de precios</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Nombre *"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: Especial"
            />

            <Input
              label="Código *"
              value={createForm.code}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  code: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                }))
              }
              placeholder="Ej: especial"
            />

            <Input
              label="Margen % *"
              type="number"
              min="0"
              step="0.01"
              value={createForm.margin_percent}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  margin_percent: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Orden"
              type="number"
              min="0"
              step="1"
              value={createForm.sort_order}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              id="new-list-active"
              type="checkbox"
              checked={createForm.active}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="new-list-active" className="text-sm text-gray-700">
              Lista activa
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setCreateForm(initialCreateForm);
              }}
            >
              Cancelar
            </Button>

            <Button type="button" onClick={handleCreateList} isLoading={isCreating}>
              Guardar Lista
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="grid gap-4">
        {priceLists.map((list) => (
          <div
            key={list.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold text-gray-900">{list.name}</div>
                <div className="text-sm text-gray-500">Código: {list.code}</div>
                <div>
                  {list.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="h-3 w-3" /> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <XCircle className="h-3 w-3" /> Inactiva
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-[420px]">
                {editingId === list.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editMargin}
                      onChange={(e) => setEditMargin(Number(e.target.value))}
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveMargin(list)}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-900 hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      Margen: {Number(list.margin_percent || 0)}%
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditClick(list)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRecalculateClick(list)}
                  disabled={isRecalculating === list.code}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-900 hover:bg-gray-200 disabled:pointer-events-none disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isRecalculating === list.code ? 'Recalculando...' : 'Recalcular'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {priceLists.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
            No hay listas de precios cargadas.
          </div>
        )}
      </div>

      <Modal
        isOpen={!!confirmingList}
        onClose={() => setConfirmingList(null)}
        title="Confirmar Recálculo"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            ¿Estás seguro de recalcular la lista <strong>{confirmingList?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esto actualizará los precios de todos los productos que no estén marcados como fijos o excluidos.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setConfirmingList(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmRecalculate}>
              Recalcular
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};