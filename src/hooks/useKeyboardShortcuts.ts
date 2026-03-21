import { useEffect } from 'react';
import { useKeyboardContext, KeyboardContextType } from '../context/KeyboardContext';

type ShortcutCallback = () => void;

interface Shortcut {
  key: string;
  callback: ShortcutCallback;
  context?: KeyboardContextType;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  const { activeContext } = useKeyboardContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      shortcuts.forEach((shortcut) => {
        if (e.key === shortcut.key) {
          if (shortcut.context && shortcut.context !== activeContext) return;
          e.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, activeContext]);
};
