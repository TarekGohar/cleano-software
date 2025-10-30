"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface InventoryLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const InventoryLoadingContext = createContext<InventoryLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function InventoryLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <InventoryLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </InventoryLoadingContext.Provider>
  );
}

export function useInventoryLoading() {
  return useContext(InventoryLoadingContext);
}

