"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface JobsLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const JobsLoadingContext = createContext<JobsLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function JobsLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return (
    <JobsLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </JobsLoadingContext.Provider>
  );
}

export function useJobsLoading() {
  return useContext(JobsLoadingContext);
}

