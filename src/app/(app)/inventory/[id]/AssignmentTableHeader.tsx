"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface AssignmentTableHeaderProps {
  label: string;
  sortKey: string;
  className?: string;
}

export function AssignmentTableHeader({
  label,
  sortKey,
  className = "",
}: AssignmentTableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSortBy = searchParams.get("sortBy") || "assignedAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

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

    startTransition(() => {
      const currentPath = window.location.pathname;
      router.push(`${currentPath}?${params.toString()}`);
    });
  };

  return (
    <th
      onClick={handleSort}
      className={`px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider cursor-pointer hover:bg-[#77C8CC]/20 transition-colors group ${className}`}>
      <div className="flex items-center gap-2">
        <span>{label}</span>
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
      </div>
    </th>
  );
}

