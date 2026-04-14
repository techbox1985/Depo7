// src/utils/rolePermissions.ts

export type Role = 'superadmin' | 'admin' | 'oficina' | 'cajero' | 'vendedor' | 'chofer';

// Define qué rutas y menú puede ver cada rol
export const rolePermissions = {
  superadmin: {
    menu: [
      '/', '/pventa', '/history', '/closures', '/expenses', '/payments',
      '/customers', '/products', '/mis-pedidos', '/price-lists', '/promotions', '/company', '/staff',
      '/orders', '/purchases', // '/providers' (si se habilita)
    ],
    routes: 'all',
  },
  admin: {
    menu: [
      '/', '/pventa', '/history', '/closures', '/expenses', '/payments',
      '/customers', '/products', '/price-lists', '/promotions', '/company', '/staff',
      '/orders', '/purchases',
    ],
    routes: 'all',
  },
  oficina: {
    menu: [
      '/pventa', '/history', '/closures', '/expenses', '/payments',
      '/customers', '/products', '/price-lists', '/promotions', '/company', '/staff',
      '/orders', '/purchases',
    ],
    routes: [
      '/pventa', '/history', '/closures', '/expenses', '/payments',
      '/customers', '/products', '/price-lists', '/promotions', '/company', '/staff',
      '/orders', '/purchases',
    ],
  },
  cajero: {
    menu: [
      '/pventa', '/history', '/closures', '/payments',
      // '/customers', // opcional si se habilita para vender
    ],
    routes: [
      '/pventa', '/history', '/closures', '/payments',
      // '/customers',
    ],
  },
  vendedor: {
    menu: ['/products', '/mis-pedidos'],
    routes: ['/products', '/mis-pedidos'],
  },
  chofer: {
    menu: [], // No ve backoffice
    routes: [], // Solo fallback
  },
};

// Helper para saber si un rol puede acceder a una ruta
export function canAccessRoute(role: Role, path: string): boolean {
  if (role === 'superadmin' || role === 'admin') return true;
  const allowed = rolePermissions[role]?.routes;
  if (allowed === 'all') return true;
  return Array.isArray(allowed) && allowed.includes(path);
}

// Helper para saber si un rol puede ver un ítem de menú
export function canSeeMenu(role: Role, path: string): boolean {
  if (role === 'superadmin' || role === 'admin') return true;
  const allowed = rolePermissions[role]?.menu;
  return Array.isArray(allowed) && allowed.includes(path);
}
