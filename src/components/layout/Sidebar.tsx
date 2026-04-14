
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, Tag, LayoutDashboard, Truck, FileText, ListOrdered, Keyboard } from 'lucide-react';
import { cn } from '../ui/Button';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';
import { canSeeMenu } from '../../utils/rolePermissions';

const navOperacion = [
  { name: 'Panel', path: '/', icon: LayoutDashboard },
  { name: 'P.Venta', path: '/pventa', icon: ShoppingCart },
  { name: 'Historial de Ventas', path: '/history', icon: FileText },
  { name: 'Cierres de Caja', path: '/closures', icon: FileText },
  { name: 'Gastos', path: '/expenses', icon: FileText },
  { name: 'Pagos', path: '/payments', icon: FileText },
];
const navComercial = [
  { name: 'Clientes', path: '/customers', icon: Tag },
  { name: 'Productos', path: '/products', icon: Package },
  { name: 'Listas de Precios', path: '/price-lists', icon: ListOrdered },
  { name: 'Promociones', path: '/promotions', icon: Tag },
  { name: 'Empresa', path: '/company', icon: Package },
  { name: 'Staff', path: '/staff', icon: LayoutDashboard },
];
const navAbastecimiento = [
  { name: 'Pedidos', path: '/orders', icon: FileText },
  { name: 'Compras', path: '/purchases', icon: Truck },
  // { name: 'Proveedores', path: '/providers', icon: Truck },
];

export const Sidebar: React.FC = () => {
  const { profile, loading } = useCurrentUserProfile();
  const role = profile?.role;

  if (loading) return null;
  if (!role) return null;

  // Sidebar especial solo para vendedor
  if (role === 'vendedor') {
    return (
      <aside className="flex flex-col w-64 border-r border-gray-200 bg-white h-full relative z-10">
        <nav className="flex-1 space-y-1 px-2 pt-16 pb-4">
          <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">MENú</div>
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Package className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
            Catálogo
          </NavLink>
          <NavLink
            to="/mis-pedidos"
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <FileText className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
            Mis pedidos
          </NavLink>
        </nav>
      </aside>
    );
  }

  // Sidebar para superadmin: menú admin normal + extras
  if (role === 'superadmin') {
    return (
      <aside className="flex flex-col w-64 border-r border-gray-200 bg-white h-full relative z-10">
        <nav className="flex-1 space-y-1 px-2 pt-16 pb-4">
          {/* Menú admin normal */}
          <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">OPERACIÓN</div>
          {navOperacion.map((item) => {
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
                <Icon className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </NavLink>
            );
          })}
          <div className="my-6 border-t border-gray-300" />
          <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">COMERCIAL</div>
          {navComercial.map((item) => {
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
                <Icon className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </NavLink>
            );
          })}
          <div className="my-6 border-t border-gray-300" />
          <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">ABASTECIMIENTO</div>
          {navAbastecimiento.map((item) => {
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
                <Icon className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </NavLink>
            );
          })}
          {/* Extras para superadmin */}
          <div className="my-6 border-t border-gray-300" />
          <div className="mb-4 px-2 text-base font-bold text-indigo-700 uppercase tracking-widest">EXTRAS</div>
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Package className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
            Catálogo (comercial)
          </NavLink>
          <NavLink
            to="/mis-pedidos"
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <FileText className="mr-3 h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-500" />
            Mis pedidos
          </NavLink>
        </nav>
      </aside>
    );
  }

  // ...existing code...
  return (
    <aside className="flex flex-col w-64 border-r border-gray-200 bg-white h-full relative z-10">
      <nav className="flex-1 space-y-1 px-2 pt-16 pb-4">
        {/* OPERACIÓN */}
        <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">OPERACIÓN</div>
        {navOperacion.filter(item => canSeeMenu(role, item.path)).map((item) => {
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
        <div className="my-6 border-t border-gray-300" />
        {/* COMERCIAL */}
        <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">COMERCIAL</div>
        {navComercial.filter(item => canSeeMenu(role, item.path)).map((item) => {
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
        <div className="my-6 border-t border-gray-300" />
        {/* ABASTECIMIENTO */}
        <div className="mb-4 px-2 text-base font-bold text-gray-700 uppercase tracking-widest">ABASTECIMIENTO</div>
        {navAbastecimiento.filter(item => canSeeMenu(role, item.path)).map((item) => {
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