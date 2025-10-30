"use client";

import { useEffect } from "react";
import { useEmployeeLoading } from "./EmployeeLoadingContext";

interface ClearLoadingOnMountProps {
  dataKey: string;
}

export function ClearLoadingOnMount({ dataKey }: ClearLoadingOnMountProps) {
  const { setLoading } = useEmployeeLoading();

  useEffect(() => {
    // Clear loading state whenever the data changes
    setLoading(false);
  }, [dataKey, setLoading]);

  return null;
}

