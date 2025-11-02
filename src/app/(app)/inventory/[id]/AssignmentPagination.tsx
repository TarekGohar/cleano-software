"use client";

import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

interface AssignmentPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
  currentCount: number;
  perPage: number;
  minDisplayRows: number;
}

export function AssignmentPagination({
  hasNextPage,
  hasPrevPage,
  nextCursor,
  prevCursor,
  currentCount,
  perPage,
  minDisplayRows,
}: AssignmentPaginationProps) {
  const searchParams = useSearchParams();

  const buildUrl = (cursor: string | null, direction: "next" | "prev") => {
    const params = new URLSearchParams(searchParams.toString());

    if (cursor) {
      params.set("cursor", cursor);
      params.set("direction", direction);
    } else {
      params.delete("cursor");
      params.delete("direction");
    }

    const currentPath = window.location.pathname;
    return `${currentPath}?${params.toString()}`;
  };

  if (currentCount < minDisplayRows && !hasNextPage && !hasPrevPage) {
    return null;
  }

  const currentCursor = searchParams.get("cursor");
  const direction = searchParams.get("direction");

  return (
    <div className="mt-4 py-4 border-t border-[#005F6A]/10">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 text-center">
          Showing{" "}
          <span className="font-[450] text-gray-900">{currentCount}</span> item
          {currentCount !== 1 ? "s" : ""} per page
          {currentCursor && (
            <span className="ml-2 text-gray-500">
              (Page{" "}
              {direction === "prev" ? "↑" : direction === "next" ? "↓" : "1"})
            </span>
          )}
        </div>

        <div className="flex justify-center items-center gap-2">
          {hasPrevPage ? (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="md"
                href={buildUrl(null, "prev")}
                submit={false}
                title="Go to first page">
                First
              </Button>
              <Button
                variant="default"
                size="md"
                href={buildUrl(prevCursor || null, "prev")}
                submit={false}>
                Previous
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="default" size="md" disabled submit={false}>
                First
              </Button>
              <Button variant="default" size="md" disabled submit={false}>
                Previous
              </Button>
            </div>
          )}

          <div className="px-4 py-2 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-sm font-[450] text-gray-700">
              {currentCursor ? "Loading..." : "Page 1"}
            </span>
          </div>

          {hasNextPage ? (
            <Button
              variant="default"
              size="md"
              href={buildUrl(nextCursor || null, "next")}
              submit={false}>
              Next
            </Button>
          ) : (
            <Button variant="default" size="md" disabled submit={false}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

