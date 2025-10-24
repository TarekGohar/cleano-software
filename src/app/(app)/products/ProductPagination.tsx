"use client";

import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export function ProductPagination({
  currentPage,
  totalPages,
  totalCount,
  perPage,
}: ProductPaginationProps) {
  const searchParams = useSearchParams();

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);

  return (
    <Card variant="default">
      <div className="space-y-4">
        {/* Results Count */}
        <div className="text-sm text-gray-600 text-center">
          Showing <span className="font-medium text-gray-900">{startItem}</span>{" "}
          to <span className="font-medium text-gray-900">{endItem}</span> of{" "}
          <span className="font-medium text-gray-900">{totalCount}</span>{" "}
          products
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2">
          {/* Previous Button */}
          {currentPage > 1 ? (
            <Button
              variant="default"
              size="md"
              href={buildUrl(currentPage - 1)}
              submit={false}>
              Previous
            </Button>
          ) : (
            <Button variant="default" size="md" disabled submit={false}>
              Previous
            </Button>
          )}

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((pageNum) => {
                // Show first page, last page, current page, and pages around current
                return (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                );
              })
              .map((pageNum, idx, arr) => {
                // Add ellipsis if there's a gap
                const prevPageNum = arr[idx - 1];
                const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                return (
                  <div key={pageNum} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <Button
                      variant={pageNum === currentPage ? "primary" : "outline"}
                      size="md"
                      href={buildUrl(pageNum)}
                      submit={false}>
                      {pageNum}
                    </Button>
                  </div>
                );
              })}
          </div>

          {/* Next Button */}
          {currentPage < totalPages ? (
            <Button
              variant="default"
              size="md"
              href={buildUrl(currentPage + 1)}
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
    </Card>
  );
}
