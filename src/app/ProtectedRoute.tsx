import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { canAccessRoute } from '../utils/rolePermissions';
import RestrictedAccess from '../components/ui/RestrictedAccess';

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
    return <RestrictedAccess />;
  }

  if (!canAccessRoute(profile.role, path)) {
    return <RestrictedAccess />;
  }

  return <Outlet />;
};
