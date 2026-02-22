'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface BreadcrumbContextValue {
  dynamicLabel: string | null;
  setDynamicLabel: (label: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  dynamicLabel: null,
  setDynamicLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [dynamicLabel, setDynamicLabelState] = useState<string | null>(null);
  const setDynamicLabel = useCallback((label: string | null) => {
    setDynamicLabelState(label);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ dynamicLabel, setDynamicLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbContext);
}
