import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, Tag, LayoutDashboard, Truck, FileText, ListOrdered } from 'lucide-react';
import { cn } from '../ui/Button';

const navItems = [
  { name: 'Panel', path: '/', icon: LayoutDashboard },
  { name: 'Punto de venta', path: '/pos', icon: ShoppingCart },
  { name: 'Productos', path: '/products', icon: Package },
  { name: 'Listas de Precios', path: '/price-lists', icon: ListOrdered },
  { name: 'Pedidos', path: '/orders', icon: FileText },
  { name: 'Compras', path: '/purchases', icon: Truck },
  { name: 'Promociones', path: '/promotions', icon: Tag },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] relative z-10">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};