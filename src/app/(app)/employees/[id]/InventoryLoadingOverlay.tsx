"use client";

import { useInventoryLoading } from "./InventoryLoadingContext";

export function InventoryLoadingOverlay() {
  const { isLoading } = useInventoryLoading();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
      <div className="flex items-center gap-2 text-[#005F6A] bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="font-[450] text-sm">Loading inventory...</span>
      </div>
    </div>
  );
}
