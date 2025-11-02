"use client";

import { Loader } from "lucide-react";
import { useInventoryLoading } from "./InventoryLoadingContext";

export function InventoryLoadingOverlay() {
  const { isLoading } = useInventoryLoading();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col text-[#005F6A] items-center justify-center">
      <Loader className="w-4 h-4 animate-spin mb-2" />
      <span className="font-[450] text-sm">Loading inventory...</span>
    </div>
  );
}
