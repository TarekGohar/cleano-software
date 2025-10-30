"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface EmployeeLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const EmployeeLoadingContext = createContext<EmployeeLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function EmployeeLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <EmployeeLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </EmployeeLoadingContext.Provider>
  );
}

export function useEmployeeLoading() {
  return useContext(EmployeeLoadingContext);
}

