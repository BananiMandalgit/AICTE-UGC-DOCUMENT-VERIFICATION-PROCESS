import React, { createContext, useContext, useState, useEffect } from 'react';

export type PortalType = 'AICTE' | 'UGC' | null;

interface PortalContextType {
  selectedPortal: PortalType;
  setSelectedPortal: (portal: PortalType) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedPortal') as PortalType;
    if (stored) {
      setSelectedPortal(stored);
    }
  }, []);

  // Save to localStorage whenever it changes
  const handleSetSelectedPortal = (portal: PortalType) => {
    setSelectedPortal(portal);
    if (portal) {
      localStorage.setItem('selectedPortal', portal);
    } else {
      localStorage.removeItem('selectedPortal');
    }
  };

  return (
    <PortalContext.Provider value={{ selectedPortal, setSelectedPortal: handleSetSelectedPortal }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
