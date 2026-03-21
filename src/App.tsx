/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { InstallButton } from './components/InstallButton';
import { useSyncOfflineSales } from './hooks/useSyncOfflineSales';

export default function App() {
  useSyncOfflineSales();

  return (
    <>
      <RouterProvider router={router} />
      <InstallButton />
    </>
  );
}
