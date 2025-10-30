import {
  HeaderSkeleton,
  MetricCardSkeleton,
  JobCardSkeleton,
  ProductListSkeleton,
  InventoryTableSkeleton,
} from "./LoadingSkeleton";
import Card from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* Metrics Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Jobs Section Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Section Skeleton */}
      <Card variant="default">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
          </div>
          <InventoryTableSkeleton />
        </div>
      </Card>

      {/* Analytics Section Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="default">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            <ProductListSkeleton />
          </div>
        </Card>

        <Card variant="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <ProductListSkeleton />
          </div>
        </Card>
      </div>

      {/* Requests Table Skeleton */}
      <Card variant="default">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

