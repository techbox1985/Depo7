import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { POSView } from '../components/pos/POSView';
import { ProductGrid } from '../components/products/ProductGrid';
import { PromotionsManager } from '../components/promotions/PromotionsManager';
import { PurchasesList } from '../components/purchases/PurchasesList';
import { OrdersView } from '../components/orders/OrdersView';
import { Login } from '../components/auth/Login';
import { PriceListsView } from '../components/price-lists/PriceListsView';

const AppLayout = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50">Cargando...</div>;
  if (!session) return <Login />;

  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Ventas de hoy</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">$0.00</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Promociones activas</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Productos con bajo stock</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        path: 'pos',
        element: <POSView />,
      },
      {
        path: 'products',
        element: (
          <div className="p-8">
            <ProductGrid />
          </div>
        ),
      },
      {
        path: 'promotions',
        element: <PromotionsManager />,
      },
      {
        path: 'orders',
        element: <OrdersView />,
      },
      {
        path: 'purchases',
        element: <PurchasesList />,
      },
      {
        path: 'price-lists',
        element: (
          <div className="p-8">
            <PriceListsView />
          </div>
        ),
      },
    ],
  },
]);
