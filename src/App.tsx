/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { syncService } from './services/syncService';
import { InstallButton } from './components/InstallButton';

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      syncService.syncPendingSales();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <InstallButton />
    </>
  );
}
