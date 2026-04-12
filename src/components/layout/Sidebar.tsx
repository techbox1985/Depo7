import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, Tag, LayoutDashboard, Truck, FileText, ListOrdered, Keyboard } from 'lucide-react';
import { cn } from '../ui/Button';

const navItems = [
  { name: 'Panel', path: '/', icon: LayoutDashboard },
  { name: 'P.Venta', path: '/pventa', icon: ShoppingCart },
  { name: 'Historial de Ventas', path: '/history', icon: FileText },
  { name: 'Cierres de Caja', path: '/closures', icon: FileText },
  { name: 'Clientes', path: '/customers', icon: Tag },
  { name: 'Productos', path: '/products', icon: Package },
  { name: 'Pagos', path: '/payments', icon: FileText },
  { name: 'Listas de Precios', path: '/price-lists', icon: ListOrdered },
  { name: 'Promociones', path: '/promotions', icon: Tag },
  { name: 'Gastos', path: '/expenses', icon: FileText },
];

const devNavItems = [
  { name: 'Pedidos', path: '/orders', icon: FileText },
  { name: 'Compras', path: '/purchases', icon: Truck },
  // { name: 'Pagos', path: '/payments', icon: FileText }, // Eliminado: no existe módulo
  { name: 'Proveedores', path: '/providers', icon: Truck }, // Placeholder
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="flex flex-col w-64 border-r border-gray-200 bg-white h-full relative z-10">
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
                      'mr-3 h-5 w-5 shrink-0',
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
        
        <div className="my-4 border-t border-gray-200" />
        <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Módulos en desarrollo
        </div>

        {devNavItems.map((item) => {
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
                      'mr-3 h-5 w-5 shrink-0',
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