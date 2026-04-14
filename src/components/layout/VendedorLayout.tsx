import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Sidebar } from '../layout/Sidebar';
import { useCurrentUserProfile } from '../../hooks/useCurrentUserProfile';

const VendedorLayout: React.FC = () => {
  const { profile } = useCurrentUserProfile();
  if (!profile || profile.role !== 'vendedor') return null;
  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="fixed inset-y-0 left-0 z-20 w-64 bg-white flex flex-col h-full">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto relative z-10 lg:ml-64">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendedorLayout;
