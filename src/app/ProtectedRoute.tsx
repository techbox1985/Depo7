import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
function isProfileIncomplete(profile: any) {
  return !profile?.full_name || !profile?.phone || !profile?.role;
}
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
  if (isProfileIncomplete(profile) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  // Si el perfil ya está completo y está en /onboarding, redirigir fuera
  if (!isProfileIncomplete(profile) && location.pathname === '/onboarding') {
    if (profile.role === 'vendedor' || profile.role === 'chofer') {
      return <Navigate to="/catalog" replace />;
    }
    return <Navigate to="/" replace />;
  }

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
