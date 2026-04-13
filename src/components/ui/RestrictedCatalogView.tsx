import React, { useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { getBasePrice } from '../../utils/priceUtils';
import { formatMoney } from '../../utils/money';

const CatalogCard = ({ product }: { product: any }) => {
  const imageUrl = product.image_url || 'https://cdn.vectorstock.com/i/500p/98/75/shw-logo-design-template-with-strong-and-modern-vector-50999875.jpg';
  const price = getBasePrice(product, 'lista_1');
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover object-center" loading="lazy" />
      </div>
      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2" title={product.name}>{product.name}</h3>
        <div className="text-xs text-gray-500 mb-2">{product.rubro || 'Sin rubro'} • {product.marca || 'Sin marca'}</div>
        <div className="text-lg font-bold text-indigo-700 mb-2">{formatMoney(price)}</div>
      </div>
    </div>
  );
};

const sortCatalog = (products: any[]) => {
  // Primero con imagen, luego sin imagen, luego por nombre
  return [...products].sort((a, b) => {
    const aHasImg = !!a.image_url;
    const bHasImg = !!b.image_url;
    if (aHasImg !== bHasImg) return bHasImg ? 1 : -1;
    return String(a.name).localeCompare(String(b.name));
  });
};

const RestrictedCatalogView: React.FC = () => {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [rubro, setRubro] = useState('');
  const [marca, setMarca] = useState('');

  const rubros = useMemo(() => Array.from(new Set(products.map((p) => p.rubro).filter(Boolean))), [products]);
  const marcas = useMemo(() => Array.from(new Set(products.map((p) => p.marca).filter(Boolean))), [products]);

  const filtered = useMemo(() => {
    let filtered = products;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.cod || '').toLowerCase().includes(q));
    }
    if (rubro) filtered = filtered.filter((p) => p.rubro === rubro);
    if (marca) filtered = filtered.filter((p) => p.marca === marca);
    return sortCatalog(filtered);
  }, [products, search, rubro, marca]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Catálogo de Productos</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 w-full sm:w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={rubro}
            onChange={e => setRubro(e.target.value)}
          >
            <option value="">Todos los rubros</option>
            {rubros.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={marca}
            onChange={e => setMarca(e.target.value)}
          >
            <option value="">Todas las marcas</option>
            {marcas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>
      <main className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => <CatalogCard key={product.id} product={product} />)}
            {filtered.length === 0 && <div className="col-span-full text-center text-gray-400">No se encontraron productos.</div>}
          </div>
        )}
      </main>
    </div>
  );
};

export default RestrictedCatalogView;
