"use client";

import { useEffect } from "react";
import { useJobsLoading } from "./JobsLoadingContext";

interface ClearLoadingOnMountProps {
  dataKey: string;
}

export function ClearLoadingOnMount({ dataKey }: ClearLoadingOnMountProps) {
  const { setLoading } = useJobsLoading();

  useEffect(() => {
    // Clear loading state whenever the data changes
    setLoading(false);
  }, [dataKey, setLoading]);

  return null;
}

