/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { InstallButton } from './components/InstallButton';
import { useSyncOfflineSales } from './hooks/useSyncOfflineSales';
import { KeyboardProvider } from './context/KeyboardContext';
import { EscapeHandler } from './components/keyboard/EscapeHandler';
import { KeyboardShortcutsHandler } from './components/keyboard/KeyboardShortcutsHandler';

export default function App() {
  useSyncOfflineSales();

  return (
    <KeyboardProvider>
      <EscapeHandler />
      <KeyboardShortcutsHandler />
      <RouterProvider router={router} />
      <InstallButton />
    </KeyboardProvider>
  );
}
