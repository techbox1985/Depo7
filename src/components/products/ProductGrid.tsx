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

import { getBasePrice } from '../../utils/priceUtils';

export const ProductGrid: React.FC = React.memo(() => {
  const location = useLocation();
  const isPOS = location.pathname.includes('/pos');
  
  const { products, isLoading, isLoadingMore, hasMore, error, fetchMoreProducts } = useProducts();
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
    sin_stock: 0
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    productsService.getProductsStats().then(setStats).catch(console.error);
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback((node: HTMLDivElement | HTMLTableRowElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreProducts();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, fetchMoreProducts]);

  // Unique values for filters
  const rubros = useMemo(() => Array.from(new Set(products.map(p => p.rubro).filter(Boolean))), [products]);
  const marcas = useMemo(() => Array.from(new Set(products.map(p => p.marca).filter(Boolean))), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (product.barcode && product.barcode.includes(searchTerm));
      const matchesRubro = filterRubro ? product.rubro === filterRubro : true;
      const matchesMarca = filterMarca ? product.marca === filterMarca : true;
      
      let matchesEstado = true;
      if (filterEstado === 'activo') matchesEstado = product.estado === 'activo' || product.estado === 'active';
      if (filterEstado === 'inactivo') matchesEstado = product.estado === 'inactivo' || product.estado === 'inactive';
      
      let matchesStock = true;
      if (filterStock === 'con_stock') matchesStock = product.stock > 0;
      if (filterStock === 'sin_stock') matchesStock = product.stock <= 0;

      return matchesSearch && matchesRubro && matchesMarca && matchesEstado && matchesStock;
    });
  }, [products, searchTerm, filterRubro, filterMarca, filterEstado, filterStock]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && products.length === 0) {
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

      {/* Statistics Panel */}
      {!isPOS && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <Package className="h-6 w-6 text-indigo-500 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activos}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <XCircle className="h-6 w-6 text-red-500 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactivos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.inactivos}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <Package className="h-6 w-6 text-emerald-500 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Con Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.con_stock}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500 mb-2" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sin Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.sin_stock}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Filter className="h-4 w-4" /> Filtros:
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            value={filterRubro}
            onChange={(e) => setFilterRubro(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Todos los rubros</option>
            {rubros.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          
          <select
            value={filterMarca}
            onChange={(e) => setFilterMarca(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Todas las marcas</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
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
            if (filteredProducts.length === index + 1) {
              return (
                <div ref={lastProductElementRef as React.RefObject<HTMLDivElement>} key={product.id}>
                  <ProductCard product={product} onViewHistory={handleViewHistory} />
                </div>
              );
            } else {
              return <ProductCard key={product.id} product={product} onViewHistory={handleViewHistory} />;
            }
          })}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rubro / Marca</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Min.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio May.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => {
                  const isLast = filteredProducts.length === index + 1;
                  const isInactive = product.estado === 'inactivo' || product.estado === 'inactive';
                  const isOutOfStock = product.stock <= 0;
                  
                  const minPrice = getBasePrice(product, 'minorista');
                  const mayPrice = getBasePrice(product, 'mayorista');
                  const costo = product.costo || 0;
                  
                  const minMargin = costo > 0 ? ((minPrice - costo) / costo * 100).toFixed(0) : 0;
                  const mayMargin = costo > 0 ? ((mayPrice - costo) / costo * 100).toFixed(0) : 0;
                  
                  return (
                    <tr 
                      key={product.id} 
                      ref={isLast ? (lastProductElementRef as React.RefObject<HTMLTableRowElement>) : null}
                      className={`hover:bg-gray-50 ${isInactive ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200 relative">
                            <img className={`h-10 w-10 object-cover ${isOutOfStock ? 'grayscale opacity-60' : ''}`} src={product.image_url || 'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg'} alt="" loading="lazy" referrerPolicy="no-referrer" />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                <span className="text-white font-bold text-[8px] tracking-wider uppercase">0</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={product.name}>{product.name}</div>
                            <div className="text-sm text-gray-500">{product.barcode || 'Sin código'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.rubro || '-'}</div>
                        <div className="text-sm text-gray-500">{product.marca || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMoney(costo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatMoney(minPrice)}</div>
                        <div className="text-xs text-gray-500">{minMargin}% mg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatMoney(mayPrice)}</div>
                        <div className="text-xs text-gray-500">{mayMargin}% mg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isInactive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isInactive ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="p-1.5 h-auto" 
                            onClick={() => handleViewHistory(product)}
                            title="Ver historial"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="p-1.5 h-auto" 
                            onClick={() => handleEdit(product)}
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
      
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}
      
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
          <p className="mt-1 text-sm text-gray-500">Intenta cambiar los filtros o el término de búsqueda.</p>
        </div>
      )}

      {isEditModalOpen && (
        <ProductFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
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

