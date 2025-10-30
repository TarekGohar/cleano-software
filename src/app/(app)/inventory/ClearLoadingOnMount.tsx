"use client";

import { useEffect } from "react";
import { useProductLoading } from "./InventoryLoadingContext";

interface ClearLoadingOnMountProps {
  dataKey: string;
}

export function ClearLoadingOnMount({ dataKey }: ClearLoadingOnMountProps) {
  const { setLoading } = useProductLoading();

  useEffect(() => {
    // Clear loading state whenever the data changes
    setLoading(false);
  }, [dataKey, setLoading]);

  return null;
}

