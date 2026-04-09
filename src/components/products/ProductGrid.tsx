import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Spinner } from '../ui/Spinner';
import { Search, Filter, Package, CheckCircle, XCircle, AlertTriangle, Edit2, History, Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { productsService } from '../../services/productsService';
import { ProductFormModal } from './ProductFormModal';
import { ProductHistoryModal } from './ProductHistoryModal';
import { Product } from '../../types';
import { formatMoney } from '../../utils/money';
import { getFractionalLabel } from '../../utils/stockUtils';
import { getBasePrice, getActivePromotion } from '../../utils/priceUtils';
import { usePromotions } from '../../hooks/usePromotions';

type ProductSearchRow = {
  id: string;
  cod: string | null;
  name: string;
  stock: number;
  estado: string | null;
  rubro: string | null;
  marca: string | null;
  image_url: string | null;
};

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

const getSearchScore = (product: { cod?: string | null; name?: string | null }, q: string) => {
  const cod = normalize(product.cod);
  const name = normalize(product.name);

  if (!q) return 0;
  if (cod === q) return 100;
  if (cod.startsWith(q)) return 80;
  if (name.startsWith(q)) return 60;
  if (cod.includes(q)) return 40;
  if (name.includes(q)) return 20;
  return 0;
};

export const ProductGrid: React.FC = React.memo(() => {
  const location = useLocation();
  const isPOS = location.pathname.includes('/pos');

  const {
    products: posProducts,
    isLoading: isPosLoading,
    isLoadingMore,
    hasMore,
    error: posError,
    fetchMoreProducts,
  } = useProducts();

  const { promotions } = usePromotions();

  const [searchProducts, setSearchProducts] = useState<ProductSearchRow[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterStock, setFilterStock] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    con_stock: 0,
    sin_stock: 0,
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    productsService.getProductsStats().then(setStats).catch(console.error);
  }, []);

  useEffect(() => {
    if (isPOS) return;

    let active = true;

    const loadSearchView = async () => {
      try {
        setIsSearchLoading(true);
        setSearchError(null);
        const data = await productsService.getProductsSearchView();
        if (!active) return;
        setSearchProducts(data);
      } catch (err: any) {
        if (!active) return;
        setSearchError(err?.message || 'Error al cargar productos');
      } finally {
        if (active) setIsSearchLoading(false);
      }
    };

    loadSearchView();

    return () => {
      active = false;
    };
  }, [isPOS]);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback(
    (node: HTMLDivElement | HTMLTableRowElement | null) => {
      if (!isPOS) return;
      if (isLoadingMore) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          fetchMoreProducts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isPOS, isLoadingMore, hasMore, fetchMoreProducts]
  );

  const sourceProducts = useMemo(() => {
    return isPOS ? (posProducts as Array<Product | ProductSearchRow>) : (searchProducts as Array<Product | ProductSearchRow>);
  }, [isPOS, posProducts, searchProducts]);

  const rubros = useMemo(
    () => Array.from(new Set(sourceProducts.map((p) => p.rubro).filter(Boolean))),
    [sourceProducts]
  );

  const marcas = useMemo(
    () => Array.from(new Set(sourceProducts.map((p) => p.marca).filter(Boolean))),
    [sourceProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = normalize(searchTerm);

    const structurallyFiltered = sourceProducts.filter((product) => {
      const matchesRubro = filterRubro ? product.rubro === filterRubro : true;
      const matchesMarca = filterMarca ? product.marca === filterMarca : true;

      let matchesEstado = true;
      if (filterEstado === 'activo') matchesEstado = product.estado === 'activo' || product.estado === 'active';
      if (filterEstado === 'inactivo') matchesEstado = product.estado === 'inactivo' || product.estado === 'inactive';

      let matchesStock = true;
      if (filterStock === 'con_stock') matchesStock = Number(product.stock ?? 0) > 0;
      if (filterStock === 'sin_stock') matchesStock = Number(product.stock ?? 0) <= 0;

      return matchesRubro && matchesMarca && matchesEstado && matchesStock;
    });

    if (!q) return structurallyFiltered;

    return structurallyFiltered
      .map((product) => ({
        product,
        score: getSearchScore(product, q),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Prioridad absoluta: cod exacto, luego cod empieza, luego name empieza, luego cod incluye, luego name incluye
        // Desempate por nombre ascendente
        return normalize(a.product.name).localeCompare(normalize(b.product.name));
      })
      .map((item) => item.product);
  }, [sourceProducts, searchTerm, filterRubro, filterMarca, filterEstado, filterStock]);

  const handleEdit = (product: Product | ProductSearchRow) => {
    setEditingProduct(product as Product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (product: Product | ProductSearchRow) => {
    setHistoryProduct(product as Product);
    setIsHistoryModalOpen(true);
  };

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  }, []);

  const isLoading = isPOS ? isPosLoading : isSearchLoading;
  const error = isPOS ? posError : searchError;

  if (isLoading && sourceProducts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && sourceProducts.length === 0) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar productos</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
        {!isPOS && (
          <Button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        )}
      </div>

      {!isPOS && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <Package className="mb-2 h-6 w-6 text-indigo-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <CheckCircle className="mb-2 h-6 w-6 text-green-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <XCircle className="mb-2 h-6 w-6 text-red-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Inactivos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.inactivos}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <Package className="mb-2 h-6 w-6 text-emerald-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Con Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.con_stock}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <AlertTriangle className="mb-2 h-6 w-6 text-amber-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Sin Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.sin_stock}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por código o nombre..."
              className="w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Filter className="h-4 w-4" /> Filtros:
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <select
            value={filterRubro}
            onChange={(e) => setFilterRubro(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Todos los rubros</option>
            {rubros.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={filterMarca}
            onChange={(e) => setFilterMarca(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>

          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Cualquier stock</option>
            <option value="con_stock">Con stock</option>
            <option value="sin_stock">Sin stock</option>
          </select>
        </div>
      </div>

      {isPOS ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => {
            const typedProduct = product as Product;

            if (filteredProducts.length === index + 1) {
              return (
                <div ref={lastProductElementRef as React.RefObject<HTMLDivElement>} key={typedProduct.id}>
                  <ProductCard product={typedProduct} onViewHistory={handleViewHistory} />
                </div>
              );
            }

            return <ProductCard key={typedProduct.id} product={typedProduct} onViewHistory={handleViewHistory} />;
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rubro / Marca
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Costo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lista 1
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lista 2
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lista 3
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProducts.map((product, index) => {
                  const typedProduct = product as Product & ProductSearchRow;
                  const isLast = filteredProducts.length === index + 1;
                  const isInactive = typedProduct.estado === 'inactivo' || typedProduct.estado === 'inactive';
                  const isOutOfStock = Number(typedProduct.stock ?? 0) <= 0;

                  const lista1 = getBasePrice(typedProduct, 'lista_1');
                  const lista2 = getBasePrice(typedProduct, 'lista_2');
                  const lista3 = getBasePrice(typedProduct, 'lista_3');
                  const costo = typedProduct.costo || 0;

                  const margin1 = costo > 0 ? ((lista1 - costo) / costo) * 100 : 0;
                  const margin2 = costo > 0 ? ((lista2 - costo) / costo) * 100 : 0;
                  const margin3 = costo > 0 ? ((lista3 - costo) / costo) * 100 : 0;

                  return (
                    <tr
                      key={typedProduct.id}
                      ref={isLast ? (lastProductElementRef as React.RefObject<HTMLTableRowElement>) : null}
                      className={`hover:bg-gray-50 ${isInactive ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            <img
                              className={`h-10 w-10 object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                              src={
                                typedProduct.image_url ||
                                'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg'
                              }
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-white">0</span>
                              </div>
                            )}
                          </div>

                          <div className="ml-4">
                            <div className="max-w-[200px] truncate text-sm font-medium text-gray-900" title={typedProduct.name}>
                              {typedProduct.name}
                            </div>

                            <div className="mt-1 text-sm text-gray-500">Cód: {typedProduct.cod || '-'}</div>

                            {getActivePromotion(typedProduct, promotions) && (
                              <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                PROMO -{getActivePromotion(typedProduct, promotions)?.discount_percentage}%
                              </span>
                            )}

                            {getFractionalLabel(typedProduct) && (
                              <div className="mt-1">
                                <span className="inline-flex whitespace-nowrap rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                  {getFractionalLabel(typedProduct)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{typedProduct.rubro || '-'}</div>
                        <div className="text-sm text-gray-500">{typedProduct.marca || '-'}</div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {typedProduct.stock}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{formatMoney(costo)}</td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{formatMoney(lista1)}</div>
                        <div className="text-xs text-gray-500">{margin1.toFixed(0)}% mg</div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{formatMoney(lista2)}</div>
                        <div className="text-xs text-gray-500">{margin2.toFixed(0)}% mg</div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{formatMoney(lista3)}</div>
                        <div className="text-xs text-gray-500">{margin3.toFixed(0)}% mg</div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isInactive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isInactive ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-auto p-1.5"
                            onClick={() => handleViewHistory(typedProduct)}
                            title="Ver historial"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-auto p-1.5"
                            onClick={() => handleEdit(typedProduct)}
                            title="Editar producto"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPOS && isLoadingMore && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <Search className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
          <p className="mt-1 text-sm text-gray-500">Intenta cambiar los filtros o el término de búsqueda.</p>
        </div>
      )}

      {isEditModalOpen && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          product={editingProduct || undefined}
          onSave={() => {
            productsService.getProductsStats().then(setStats).catch(console.error);
          }}
        />
      )}

      {isHistoryModalOpen && (
        <ProductHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setHistoryProduct(null);
          }}
          product={historyProduct}
        />
      )}
    </div>
  );
});

export default ProductGrid;