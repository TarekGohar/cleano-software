"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface ActivityLogPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  jobId: string;
}

export default function ActivityLogPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  jobId,
}: ActivityLogPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("logsPage", page.toString());
    router.push(`/jobs/${jobId}?${params.toString()}#logs`, { scroll: false });
  };

  return (
    <div className="bg-neutral-950/5 px-6 py-3 border-t border-neutral-950/10 -mx-6 -mb-6 rounded-b-2xl">
      <div className="flex items-center justify-between">
        {/* Results Info */}
        <div className="text-xs text-neutral-950/70">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
          {totalItems} logs
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-2">
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="px-3 min-w-8">
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2">
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2">
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
