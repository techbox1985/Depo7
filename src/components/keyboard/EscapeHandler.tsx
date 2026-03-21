import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useKeyboardContext } from '../../context/KeyboardContext';
import { useMemo } from 'react';

export const EscapeHandler = () => {
  const { modalOnClose } = useKeyboardContext();

  const shortcuts = useMemo(() => [
    {
      key: 'Escape',
      context: 'modal',
      callback: () => {
        if (modalOnClose) {
          modalOnClose();
        }
      },
    },
  ], [modalOnClose]);

  useKeyboardShortcuts(shortcuts);

  return null;
};
