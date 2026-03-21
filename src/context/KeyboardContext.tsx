import React, { createContext, useContext, useState } from 'react';

export type KeyboardContextType = 'default' | 'modal' | 'pos' | 'table';

interface KeyboardContextState {
  activeContext: KeyboardContextType;
  setActiveContext: (context: KeyboardContextType) => void;
}

const KeyboardContext = createContext<KeyboardContextState>({
  activeContext: 'default',
  setActiveContext: () => {},
});

export const KeyboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeContext, setActiveContext] = useState<KeyboardContextType>('default');

  return (
    <KeyboardContext.Provider value={{ activeContext, setActiveContext }}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboardContext = () => useContext(KeyboardContext);
