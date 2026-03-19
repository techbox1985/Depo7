import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product, PriceList, ProductPrice } from '../../types';
import { useProducts } from '../../hooks/useProducts';
import { priceListsService } from '../../services/priceListsService';
import { roundMoney, formatMoney } from '../../utils/money';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave?: () => void;
}

type ProductPriceFormState = Partial<ProductPrice> & {
  final_price: number;
  is_fixed: boolean;
  exclude_from_mass_update: boolean;
};

type FormErrors = {
  name?: string;
  stock?: string;
  costo?: string;
  estado?: string;
  priceLists?: string;
};

const getSafeNumber = (value: unknown, fallback = 0) => {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

export const ProductFormModal: React.FC<ProductFormModalProps> = React.memo(
  ({ isOpen, onClose, product, onSave }) => {
    const { addProduct, updateProduct, refreshProducts, products } = useProducts();

    const [isLoading, setIsLoading] = useState(false);
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [productPrices, setProductPrices] = useState<Record<string, ProductPriceFormState>>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [showRubroSuggestions, setShowRubroSuggestions] = useState(false);
    const [showMarcaSuggestions, setShowMarcaSuggestions] = useState(false);

    const [formData, setFormData] = useState<Partial<Product>>(
      product || {
        name: '',
        stock: 0,
        rubro: '',
        marca: '',
        barcode: '',
        image_url: '',
        estado: 'activo',
        price: 0,
        wholesale_price: 0,
        costo: 0,
      }
    );

    useEffect(() => {
      if (!isOpen) return;

      setErrors({});
      setShowRubroSuggestions(false);
      setShowMarcaSuggestions(false);

      setFormData(
        product || {
          name: '',
          stock: 0,
          rubro: '',
          marca: '',
          barcode: '',
          image_url: '',
          estado: 'activo',
          price: 0,
          wholesale_price: 0,
          costo: 0,
        }
      );
    }, [isOpen, product]);

    useEffect(() => {
      const fetchLists = async () => {
        try {
          const lists = await priceListsService.getPriceLists();
          setPriceLists(lists);

          const initialPrices: Record<string, ProductPriceFormState> = {};

          lists.forEach((list) => {
            const existingPrice = product?.product_prices?.find(
              (p) => p.price_list_id === list.id
            );

            const {
              id,
              product_id,
              final_price,
              is_fixed,
              exclude_from_mass_update,
            } = existingPrice || {};

            initialPrices[list.id] = {
              id,
              product_id,
              price_list_id: list.id,
              final_price: getSafeNumber(final_price, 0),
              is_fixed: Boolean(is_fixed),
              exclude_from_mass_update: Boolean(exclude_from_mass_update),
            };
          });

          setProductPrices(initialPrices);
        } catch (error) {
          console.error('Error fetching price lists:', error);
        }
      };

      if (isOpen) {
        fetchLists();
      }
    }, [isOpen, product]);

    const rubroOptions = useMemo(() => {
      return Array.from(
        new Set(
          (products || [])
            .map((p) => (p?.rubro || '').trim())
            .filter((value) => value.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b, 'es'));
    }, [products]);

    const marcaOptions = useMemo(() => {
      return Array.from(
        new Set(
          (products || [])
            .map((p) => (p?.marca || '').trim())
            .filter((value) => value.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b, 'es'));
    }, [products]);

    const filteredRubros = useMemo(() => {
      const query = normalizeText(String(formData.rubro || ''));
      if (!query) return rubroOptions.slice(0, 8);

      return rubroOptions
        .filter((item) => normalizeText(item).includes(query))
        .slice(0, 8);
    }, [rubroOptions, formData.rubro]);

    const filteredMarcas = useMemo(() => {
      const query = normalizeText(String(formData.marca || ''));
      if (!query) return marcaOptions.slice(0, 8);

      return marcaOptions
        .filter((item) => normalizeText(item).includes(query))
        .slice(0, 8);
    }, [marcaOptions, formData.marca]);

    const getSuggestedPrice = (marginPercent: number) => {
      const costo = getSafeNumber(formData.costo, 0);
      return roundMoney(costo * (1 + marginPercent / 100));
    };

    const handlePriceChange = (
      list: PriceList,
      field: keyof ProductPriceFormState,
      value: any
    ) => {
      setProductPrices((prev) => {
        const current = prev[list.id] || {
          price_list_id: list.id,
          final_price: 0,
          is_fixed: false,
          exclude_from_mass_update: false,
        };

        const next: ProductPriceFormState = {
          ...current,
          [field]: value,
        };

        if (field === 'is_fixed') {
          const checked = Boolean(value);
          next.is_fixed = checked;

          if (checked) {
            next.exclude_from_mass_update = false;
            const currentPrice = getSafeNumber(current.final_price, 0);
            if (currentPrice <= 0) {
              next.final_price = getSuggestedPrice(getSafeNumber(list.margin_percent, 0));
            }
          }
        }

        if (field === 'exclude_from_mass_update') {
          const checked = Boolean(value);
          next.exclude_from_mass_update = checked;

          if (checked) {
            next.is_fixed = false;
          }
        }

        if (field === 'final_price') {
          next.final_price = getSafeNumber(value, 0);
        }

        return {
          ...prev,
          [list.id]: next,
        };
      });
    };

    const validateForm = () => {
      const nextErrors: FormErrors = {};

      if (!String(formData.name || '').trim()) {
        nextErrors.name = 'El nombre es obligatorio.';
      }

      const stock = getSafeNumber(formData.stock, NaN);
      if (!Number.isFinite(stock) || stock < 0) {
        nextErrors.stock = 'El stock es obligatorio y debe ser 0 o mayor.';
      }

      const costo = getSafeNumber(formData.costo, NaN);
      if (!Number.isFinite(costo) || costo < 0) {
        nextErrors.costo = 'El costo es obligatorio y debe ser 0 o mayor.';
      }

      if (!String(formData.estado || '').trim()) {
        nextErrors.estado = 'El estado es obligatorio.';
      }

      if (priceLists.length > 0) {
        const hasValidPriceForEveryList = priceLists.every((list) => {
          const priceData = productPrices[list.id];
          return getSafeNumber(priceData?.final_price, 0) > 0;
        });

        if (!hasValidPriceForEveryList) {
          nextErrors.priceLists = 'Completá un precio final válido para cada lista activa.';
        }
      }

      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      try {
        const { product_prices, ...productData } = formData as any;

        let savedProductId = product?.id;

        if (product) {
          await updateProduct(product.id, productData);
        } else {
          const newProduct = await addProduct(productData as any);
          savedProductId = newProduct.id;
        }

        if (savedProductId) {
          for (const list of priceLists) {
            const priceData = productPrices[list.id];
            const finalPrice = getSafeNumber(priceData?.final_price, 0);
            const isFixed = Boolean(priceData?.is_fixed);
            const excludeFromMassUpdate = Boolean(priceData?.exclude_from_mass_update);

            await priceListsService.upsertProductPrice({
              id: priceData?.id,
              product_id: savedProductId,
              price_list_id: list.id,
              cost_price: getSafeNumber(formData.costo, 0),
              margin_percent: getSafeNumber(list.margin_percent, 0),
              final_price: finalPrice,
              is_fixed: isFixed,
              fixed_price: isFixed ? finalPrice : null,
              exclude_from_mass_update: excludeFromMassUpdate,
            });
          }
        }

        refreshProducts();
        onSave?.();
        onClose();
      } catch (error) {
        console.error('Error al guardar producto:', error);
        alert('Error al guardar el producto');
      } finally {
        setIsLoading(false);
      }
    };

    const imageUrl = String(formData.image_url || '').trim();

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product ? 'Editar Producto' : 'Agregar Producto'}
      >
        <div className="max-h-[85vh]">
          <form onSubmit={handleSubmit} className="flex max-h-[85vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div>
                <Input
                  label="Nombre *"
                  required
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative z-50">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Rubro</label>
                  <input
                    type="text"
                    value={formData.rubro || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, rubro: e.target.value });
                      setShowRubroSuggestions(true);
                    }}
                    onFocus={() => setShowRubroSuggestions(true)}
                    onBlur={() => setShowRubroSuggestions(false)}
                    placeholder="Escribí o elegí un rubro"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {showRubroSuggestions && filteredRubros.length > 0 && (
                    <div
                      className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredRubros.map((rubro) => (
                        <button
                          key={rubro}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, rubro }));
                            setShowRubroSuggestions(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
                        >
                          {rubro}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative z-40">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Marca</label>
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, marca: e.target.value });
                      setShowMarcaSuggestions(true);
                    }}
                    onFocus={() => setShowMarcaSuggestions(true)}
                    onBlur={() => setShowMarcaSuggestions(false)}
                    placeholder="Escribí o elegí una marca"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {showMarcaSuggestions && filteredMarcas.length > 0 && (
                    <div
                      className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredMarcas.map((marca) => (
                        <button
                          key={marca}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, marca }));
                            setShowMarcaSuggestions(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
                        >
                          {marca}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Stock *"
                    type="number"
                    required
                    min="0"
                    value={formData.stock ?? 0}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: getSafeNumber(e.target.value, 0) });
                      if (errors.stock) setErrors((prev) => ({ ...prev, stock: undefined }));
                    }}
                  />
                  {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
                </div>

                <div>
                  <Input
                    label="Costo ($) *"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.costo ?? 0}
                    onChange={(e) => {
                      setFormData({ ...formData, costo: getSafeNumber(e.target.value, 0) });
                      if (errors.costo) setErrors((prev) => ({ ...prev, costo: undefined }));
                    }}
                  />
                  {errors.costo && <p className="mt-1 text-xs text-red-600">{errors.costo}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Código de barras"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado *</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.estado || 'activo'}
                    onChange={(e) => {
                      setFormData({ ...formData, estado: e.target.value });
                      if (errors.estado) setErrors((prev) => ({ ...prev, estado: undefined }));
                    }}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                  {errors.estado && <p className="mt-1 text-xs text-red-600">{errors.estado}</p>}
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="mb-1 text-sm font-medium text-gray-900">Precios por Lista</h3>
                <p className="mb-3 text-xs text-gray-500">
                  Completá el precio final de cada lista. Si activás “Precio fijo”, ese precio
                  queda protegido del recálculo.
                </p>

                {errors.priceLists && (
                  <p className="mb-3 text-xs text-red-600">{errors.priceLists}</p>
                )}

                <div className="space-y-4">
                  {priceLists.map((list) => {
                    const priceData = productPrices[list.id] || {
                      price_list_id: list.id,
                      final_price: 0,
                      is_fixed: false,
                      exclude_from_mass_update: false,
                    };

                    const margin = getSafeNumber(list.margin_percent, 0);
                    const calculatedPrice = getSuggestedPrice(margin);

                    return (
                      <div
                        key={list.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {list.name} (Margen: {margin}%)
                          </span>
                          <span className="text-xs text-gray-500">
                            Precio sugerido: {formatMoney(calculatedPrice)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
                          <Input
                            label="Precio Final ($) *"
                            type="number"
                            min="0"
                            step="1"
                            value={priceData.final_price ?? 0}
                            onChange={(e) =>
                              handlePriceChange(list, 'final_price', getSafeNumber(e.target.value, 0))
                            }
                          />

                          <div className="flex h-10 items-center">
                            <input
                              type="checkbox"
                              id={`fixed-${list.id}`}
                              checked={Boolean(priceData.is_fixed)}
                              disabled={Boolean(priceData.exclude_from_mass_update)}
                              onChange={(e) => handlePriceChange(list, 'is_fixed', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <label
                              htmlFor={`fixed-${list.id}`}
                              className="ml-2 block text-sm text-gray-900"
                            >
                              Precio Fijo
                            </label>
                          </div>

                          <div className="flex h-10 items-center">
                            <input
                              type="checkbox"
                              id={`exclude-${list.id}`}
                              checked={Boolean(priceData.exclude_from_mass_update)}
                              disabled={Boolean(priceData.is_fixed)}
                              onChange={(e) =>
                                handlePriceChange(
                                  list,
                                  'exclude_from_mass_update',
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <label
                              htmlFor={`exclude-${list.id}`}
                              className="ml-2 block text-sm text-gray-900"
                            >
                              Excluir de recálculo
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Input
                label="URL de Imagen"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />

              {imageUrl && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">Vista previa</p>
                  <div className="flex justify-center overflow-hidden rounded-md border border-gray-200 bg-white p-3">
                    <img
                      src={imageUrl}
                      alt="Vista previa del producto"
                      className="max-h-40 w-auto object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-3 border-t border-gray-200 bg-white pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {product ? 'Guardar Cambios' : 'Agregar Producto'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    );
  }
);

ProductFormModal.displayName = 'ProductFormModal';