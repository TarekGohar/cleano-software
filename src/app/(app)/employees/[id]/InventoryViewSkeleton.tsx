export function InventoryViewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Inventory Metrics Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-lg  p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg  p-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 min-w-[250px] space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="w-48 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="w-32 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg ">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-9 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-200">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="px-6 py-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-6">
              <div className="px-6 py-4">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="px-6 py-4">
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="px-6 py-4">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="px-6 py-4">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="px-6 py-4">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="bg-white rounded-lg  p-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="flex justify-center items-center gap-2">
            <div className="h-9 w-20 bg-gray-200 rounded"></div>
            <div className="h-9 w-24 bg-gray-200 rounded"></div>
            <div className="h-9 w-20 bg-gray-200 rounded"></div>
            <div className="h-9 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
