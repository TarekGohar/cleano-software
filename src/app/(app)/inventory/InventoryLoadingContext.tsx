"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ProductLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const ProductLoadingContext = createContext<ProductLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function ProductLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <ProductLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </ProductLoadingContext.Provider>
  );
}

export function useProductLoading() {
  return useContext(ProductLoadingContext);
}

