"use client";

import { useEffect } from "react";
import { useInventoryLoading } from "./InventoryLoadingContext";

interface InventoryClearLoadingProps {
  dataKey: string;
}

export function InventoryClearLoading({ dataKey }: InventoryClearLoadingProps) {
  const { setLoading } = useInventoryLoading();

  useEffect(() => {
    setLoading(false);
  }, [dataKey, setLoading]);

  return null;
}

