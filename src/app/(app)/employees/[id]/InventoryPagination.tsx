"use client";

import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useInventoryLoading } from "./InventoryLoadingContext";

interface InventoryPaginationProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string | null;
  prevCursor?: string | null;
  currentCount: number;
  perPage: number;
  minDisplayRows: number;
}

export function InventoryPagination({
  hasNextPage,
  hasPrevPage,
  nextCursor,
  prevCursor,
  currentCount,
  perPage,
  minDisplayRows,
}: InventoryPaginationProps) {
  const searchParams = useSearchParams();
  const { setLoading } = useInventoryLoading();

  const buildUrl = (cursor: string | null, direction: "next" | "prev") => {
    const params = new URLSearchParams(searchParams.toString());

    if (cursor) {
      params.set("cursor", cursor);
      params.set("direction", direction);
    } else {
      params.delete("cursor");
      params.delete("direction");
    }

    // Preserve view
    if (!params.has("view")) {
      params.set("view", "inventory");
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
    <Card variant="default">
      <div className="space-y-4">
        <div className="text-sm text-gray-600 text-center">
          Showing <span className="font-medium text-gray-900">{currentCount}</span>{" "}
          item{currentCount !== 1 ? "s" : ""} per page
          {currentCursor && (
            <span className="ml-2 text-gray-500">
              (Page {direction === "prev" ? "↑" : direction === "next" ? "↓" : "1"})
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
                title="Go to first page"
                onClick={() => setLoading(true)}>
                First
              </Button>
              <Button
                variant="default"
                size="md"
                href={buildUrl(prevCursor || null, "prev")}
                submit={false}
                onClick={() => setLoading(true)}>
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
            <span className="text-sm font-medium text-gray-700">
              {currentCursor ? "Loading..." : "Page 1"}
            </span>
          </div>

          {hasNextPage ? (
            <Button
              variant="default"
              size="md"
              href={buildUrl(nextCursor || null, "next")}
              submit={false}
              onClick={() => setLoading(true)}>
              Next
            </Button>
          ) : (
            <Button variant="default" size="md" disabled submit={false}>
              Next
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

