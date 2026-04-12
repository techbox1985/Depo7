import React from 'react';
import { Menu, ChevronLeft, Bell, User, LogOut, Wifi, WifiOff, ShoppingCart } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { OnlineStatusIndicator } from '../OnlineStatusIndicator';
import { useOfflineSalesStore } from '../../store/useOfflineSalesStore';
import { useCompanySettingsHeader } from '../../hooks/useCompanySettingsHeader';

export const Header: React.FC<{ onMenuClick: () => void, isSidebarOpen: boolean }> = ({ onMenuClick, isSidebarOpen }) => {
  const { pendingSales } = useOfflineSalesStore();
  const { company } = useCompanySettingsHeader();
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 shadow">
      <div className="flex items-center relative">
        <button
          className="mr-4 flex items-center justify-center bg-white border border-gray-300 rounded-full shadow z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ position: 'relative' }}
          onClick={onMenuClick}
          title={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-6 w-6 text-gray-500" />
          ) : (
            <Menu className="h-6 w-6 text-gray-500" />
          )}
        </button>
        <div className="flex items-center gap-2 ml-1">
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Logo" className="h-9 w-9 rounded bg-white border object-contain" style={{minWidth:36}} />
          ) : null}
          <span className="text-xl font-bold text-gray-900">
            {company?.company_name || 'Sistema'}
          </span>
        </div>
        <div className="flex items-center">
          <OnlineStatusIndicator />
        </div>
        {pendingSales.length > 0 && (
          <div className="ml-4 flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <ShoppingCart className="h-3 w-3" />
            Ventas pendientes: {pendingSales.length}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Administrador</span>
        </div>
        <button 
          onClick={handleLogout}
          className="ml-4 text-gray-500 hover:text-red-600 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
