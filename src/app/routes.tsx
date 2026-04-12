import CustomersView from '../components/customers/CustomersView';
import PVenta from '../components/pventa';
import PaymentsView from '../components/payments/PaymentsView';
import { ExpensesGeneralPanel } from '../components/expenses/ExpensesGeneralPanel';
import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { POSView } from '../components/pos/POSView';
import ProductGrid from '../components/products/ProductGrid';

import { CashClosures } from '../components/cash/CashClosures';
import { PromotionsManager } from '../components/promotions/PromotionsManager';
import { PurchasesList } from '../components/purchases/PurchasesList';
import { OrdersView } from '../components/orders/OrdersView';
import PedidosView from '../components/orders/PedidosView';
import { Login } from '../components/auth/Login';
import { PriceListsView } from '../components/price-lists/PriceListsView';


type DashboardStats = {
  salesToday: number;
  activePromotions: number;
  lowStockProducts: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    activePromotions: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const [salesRes, promotionsRes, productsRes] = await Promise.all([
          supabase.from('sales').select('*'),
          supabase.from('promotions').select('*'),
          supabase.from('products').select('*, product_prices(*, price_lists(*))'),
        ]);

        if (salesRes.error) {
          console.error('Error loading dashboard sales:', salesRes.error);
        }

        if (promotionsRes.error) {
          console.error('Error loading dashboard promotions:', promotionsRes.error);
        }

        if (productsRes.error) {
          console.error('Error loading dashboard products:', productsRes.error);
        }

        const sales = salesRes.data || [];
        const promotions = promotionsRes.data || [];
        const products = productsRes.data || [];

        const salesToday = sales
          .filter((sale: any) => {
            const rawDate =
              sale.creado_en ||
              sale.created_at ||
              sale.fecha ||
              sale.sale_date ||
              sale.inserted_at;

            if (!rawDate) return false;

            const saleDate = new Date(rawDate);
            if (Number.isNaN(saleDate.getTime())) return false;

            const status = String(sale.estado || sale.status || '').toLowerCase();

            const isCompleted =
              status === 'completada' ||
              status === 'completed' ||
              status === 'finalizada' ||
              status === 'paid' ||
              status === '';

            return saleDate >= startOfDay && saleDate <= endOfDay && isCompleted;
          })
          .reduce((acc: number, sale: any) => {
            const total = Number(sale.total || sale.total_amount || sale.amount || 0);
            return acc + total;
          }, 0);

        const activePromotions = promotions.filter((promo: any) => {
          const activeFlag =
            promo.active ??
            promo.is_active ??
            (typeof promo.status === 'string'
              ? ['active', 'activa', 'vigente'].includes(promo.status.toLowerCase())
              : false);

          const startRaw = promo.starts_at || promo.start_date || promo.fecha_inicio || null;
          const endRaw = promo.ends_at || promo.end_date || promo.fecha_fin || null;

          const hasStarted = startRaw ? new Date(startRaw) <= now : true;
          const notEnded = endRaw ? new Date(endRaw) >= now : true;

          return Boolean(activeFlag) && hasStarted && notEnded;
        }).length;

        const lowStockProducts = products.filter((product: any) => {
          const stock = Number(
            product.stock ??
              product.current_stock ??
              product.stock_actual ??
              product.stockk ??
              0
          );

          const minStockRaw =
            product.min_stock ??
            product.minimum_stock ??
            product.stock_minimo ??
            product.minimumStock;

          if (minStockRaw !== undefined && minStockRaw !== null && minStockRaw !== '') {
            const minStock = Number(minStockRaw);
            if (!Number.isNaN(minStock)) {
              return stock <= minStock;
            }
          }

          return stock <= 5;
        }).length;

        setStats({
          salesToday,
          activePromotions,
          lowStockProducts,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Ventas de hoy</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : formatCurrency(stats.salesToday)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Promociones activas</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : stats.activePromotions}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Productos con bajo stock</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : stats.lowStockProducts}
          </p>
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        Cargando...
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-20 w-64 bg-white transform transition-transform duration-300 ease-in-out flex flex-col h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        
        <main className={`flex-1 overflow-y-auto relative z-10 transition-all duration-300 ${!isSidebarOpen ? '!ml-0' : 'lg:ml-64'}`}>
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
        path: 'customers',
        element: <CustomersView />,
      },
      {
        index: true,
        element: <DashboardHome />,
      },
      // POS viejo eliminado
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
        path: 'history',
        element: <OrdersView />,
      },
      {
        path: 'closures',
        element: <CashClosures />,
      },
      {
        path: 'orders',
        element: <PedidosView />,
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
      {
        path: 'expenses',
        element: (
          <div className="p-8">
            <ExpensesGeneralPanel />
          </div>
        ),
      },
      {
        path: 'pventa',
        element: (
          <div className="p-8">
            <PVenta />
          </div>
        ),
      },
      {
        path: 'payments',
        element: (
          <div className="p-8">
            <PaymentsView />
          </div>
        ),
      },
    ],
  },
]);
