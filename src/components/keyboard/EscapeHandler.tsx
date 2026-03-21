import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useKeyboardContext } from '../../context/KeyboardContext';

export const EscapeHandler = () => {
  const { modalOnClose } = useKeyboardContext();

  useKeyboardShortcuts([
    {
      key: 'Escape',
      context: 'modal',
      callback: () => {
        if (modalOnClose) {
          modalOnClose();
        }
      },
    },
  ]);

  return null;
};
