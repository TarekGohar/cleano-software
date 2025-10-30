export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="p-3 bg-gray-50 rounded-2xl">
      <div className="animate-pulse space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-2xl">
          <div className="animate-pulse flex justify-between items-center">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-40"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InventoryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50/50 px-6 py-3">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse col-span-2"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
        </div>
        {/* Rows */}
        <div className="bg-white divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-5 px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse col-span-2"></div>
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-white p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-56"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}
