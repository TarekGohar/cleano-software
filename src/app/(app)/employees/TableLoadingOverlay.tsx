"use client";

import { Loader } from "lucide-react";
import { useEmployeeLoading } from "./EmployeeLoadingContext";

export function TableLoadingOverlay() {
  const { isLoading } = useEmployeeLoading();

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
      <div className="flex flex-col items-center gap-2 ">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="font-[450] text-sm">Loading employees...</span>
      </div>
    </div>
  );
}
