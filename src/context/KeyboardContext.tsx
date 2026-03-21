import React, { createContext, useContext, useState, useMemo } from 'react';

export type KeyboardContextType = 'default' | 'modal' | 'pos' | 'table';

interface KeyboardContextState {
  activeContext: KeyboardContextType;
  setActiveContext: (context: KeyboardContextType) => void;
  modalOnClose: (() => void) | null;
  setModalOnClose: (fn: (() => void) | null) => void;
}

const KeyboardContext = createContext<KeyboardContextState>({
  activeContext: 'default',
  setActiveContext: () => {},
  modalOnClose: null,
  setModalOnClose: () => {},
});

export const KeyboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeContext, setActiveContext] = useState<KeyboardContextType>('default');
  const [modalOnClose, setModalOnClose] = useState<(() => void) | null>(null);

  const value = useMemo(() => ({ activeContext, setActiveContext, modalOnClose, setModalOnClose }), [activeContext, modalOnClose]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboardContext = () => useContext(KeyboardContext);
