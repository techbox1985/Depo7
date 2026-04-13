import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { canAccessRoute } from '../utils/rolePermissions';
import RestrictedCatalogView from '../components/ui/RestrictedCatalogView';

interface ProtectedRouteProps {
  path: string;
}

const fallbackRoles = ['vendedor', 'chofer'];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ path }) => {
  const { profile, loading } = useCurrentUserProfile();
  const location = useLocation();

  if (loading) return null;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;

  // Fallback para roles no implementados

  if (fallbackRoles.includes(profile.role)) {
    // Renderizar catálogo restringido en vez de acceso restringido
    return <RestrictedCatalogView />;
  }


  if (!canAccessRoute(profile.role, path)) {
    // Si no tiene acceso, mostrar catálogo restringido
    return <RestrictedCatalogView />;
  }

  return <Outlet />;
};
