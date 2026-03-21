import React, { useState, useMemo, useCallback } from 'react';
import { Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

export const KeyboardShortcutsHandler = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const shortcuts = useMemo(() => [
    {
      key: '?',
      context: 'default',
      callback: () => setIsOpen(true),
    },
  ], []);

  useKeyboardShortcuts(shortcuts);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors text-sm z-[9999]"
        title="Ver atajos (?)"
      >
        <Keyboard className="h-4 w-4" />
        Atajos
      </button>
      <KeyboardShortcutsModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
};
