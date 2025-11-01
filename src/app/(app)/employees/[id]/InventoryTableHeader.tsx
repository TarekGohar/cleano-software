"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useInventoryLoading } from "./InventoryLoadingContext";

interface InventoryTableHeaderProps {
  label: string;
  sortKey: string;
  className?: string;
}

export function InventoryTableHeader({
  label,
  sortKey,
  className = "",
}: InventoryTableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { setLoading } = useInventoryLoading();

  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder = searchParams.get("sortOrder") || "asc";

  const isActive = currentSortBy === sortKey;

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString());

    const newSortOrder =
      isActive && currentSortOrder === "asc" ? "desc" : "asc";

    params.set("sortBy", sortKey);
    params.set("sortOrder", newSortOrder);

    // Reset cursor when sorting changes
    params.delete("cursor");
    params.delete("direction");

    // Preserve view
    if (!params.has("view")) {
      params.set("view", "inventory");
    }

    setLoading(true);
    startTransition(() => {
      const currentPath = window.location.pathname;
      router.push(`${currentPath}?${params.toString()}`);
    });
  };

  return (
    <button
      onClick={handleSort}
      disabled={isPending}
      className={`px-6 py-3 text-left flex items-center gap-2 hover:bg-gray-100/50 transition-colors group ${className}`}>
      <span className="text-xs font-[450] text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-gray-400 group-hover:text-gray-600">
        {isActive ? (
          currentSortOrder === "asc" ? (
            <ArrowUp size={14} className="text-[#005F6A]" />
          ) : (
            <ArrowDown size={14} className="text-[#005F6A]" />
          )
        ) : (
          <ArrowUpDown
            size={14}
            className="opacity-0 group-hover:opacity-100"
          />
        )}
      </span>
    </button>
  );
}
