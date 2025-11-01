import { Prisma } from "@prisma/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { InventoryFilters } from "./InventoryFilters";
import { InventoryPagination } from "./InventoryPagination";
import { InventoryClearLoading } from "./InventoryClearLoading";
import { InventoryLoadingProvider } from "./InventoryLoadingContext";
import { InventoryList } from "./InventoryList";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

interface InventoryViewProps {
  employeeId: string;
  searchParams: SearchParams;
  assignedProducts: any[];
  availableProducts: any[];
  assignAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
}

export async function InventoryView({
  employeeId,
  searchParams,
  assignedProducts,
  availableProducts,
  assignAction,
  removeAction,
  updateAction,
}: InventoryViewProps) {
  // Parse search params
  const cursor = (searchParams.cursor as string) || null;
  const direction = (searchParams.direction as string) || null;
  const perPage = Number(searchParams.perPage) || 10;
  const search = (searchParams.search as string) || "";
  const stockStatus = (searchParams.stockStatus as string) || "all";
  const sortBy = (searchParams.sortBy as string) || "name";
  const sortOrder = (searchParams.sortOrder as string) || "asc";

  // Calculate metrics
  const totalItems = assignedProducts.length;
  const totalQuantity = assignedProducts.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalValue = assignedProducts.reduce(
    (sum, item) => sum + item.quantity * (item.product.costPerUnit || 0),
    0
  );
  const lowStockItems = assignedProducts.filter(
    (item) => item.quantity <= (item.product.minStock || 0)
  ).length;

  // Filter products
  let filteredProducts = [...assignedProducts];

  // Search filter
  if (search) {
    filteredProducts = filteredProducts.filter(
      (item) =>
        item.product.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Stock status filter
  if (stockStatus === "in-stock") {
    filteredProducts = filteredProducts.filter(
      (item) => item.quantity > (item.product.minStock || 0)
    );
  } else if (stockStatus === "low-stock") {
    filteredProducts = filteredProducts.filter(
      (item) =>
        item.quantity <= (item.product.minStock || 0) && item.quantity > 0
    );
  } else if (stockStatus === "out-of-stock") {
    filteredProducts = filteredProducts.filter((item) => item.quantity === 0);
  }

  // Sort products
  filteredProducts.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.product.name.localeCompare(b.product.name);
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
      case "value":
        const valueA = a.quantity * (a.product.costPerUnit || 0);
        const valueB = b.quantity * (b.product.costPerUnit || 0);
        comparison = valueA - valueB;
        break;
      case "assignedAt":
        comparison =
          new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Cursor-based pagination
  const take = perPage + 1;
  let paginatedProducts;

  if (cursor && direction === "next") {
    const cursorIndex = filteredProducts.findIndex((p) => p.id === cursor);
    paginatedProducts = filteredProducts.slice(
      cursorIndex + 1,
      cursorIndex + 1 + take
    );
  } else if (cursor && direction === "prev") {
    const cursorIndex = filteredProducts.findIndex((p) => p.id === cursor);
    paginatedProducts = filteredProducts
      .slice(Math.max(0, cursorIndex - take), cursorIndex)
      .slice(-perPage);
  } else {
    paginatedProducts = filteredProducts.slice(0, take);
  }

  const hasNextPage = paginatedProducts.length > perPage;
  if (hasNextPage) {
    paginatedProducts.pop();
  }

  const hasPrevPage = Boolean(cursor);
  const nextCursor = hasNextPage
    ? paginatedProducts[paginatedProducts.length - 1]?.id
    : null;
  const prevCursor = paginatedProducts[0]?.id || null;

  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(
    0,
    minDisplayRows - paginatedProducts.length
  );

  const dataKey = `${cursor}-${search}-${stockStatus}-${sortBy}-${sortOrder}-${perPage}-${paginatedProducts.length}`;

  return (
    <InventoryLoadingProvider>
      <InventoryClearLoading dataKey={dataKey} />
      <div className="space-y-6">
        {/* Inventory Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="default" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-gray-600">Total Items</p>
                <p className="text-3xl font-[450] text-gray-900">
                  {totalItems}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card variant="default" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-gray-600">
                  Total Quantity
                </p>
                <p className="text-3xl font-[450] text-[#005F6A]">
                  {totalQuantity.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-cyan-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </Card>

          <Card variant="default" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-gray-600">Total Value</p>
                <p className="text-3xl font-[450] text-green-600">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card variant="default" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-gray-600">Low Stock</p>
                <p className="text-3xl font-[450] text-orange-600">
                  {lowStockItems}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <InventoryFilters />

        {/* Inventory Table */}
        <Card variant="default">
          <InventoryList
            paginatedProducts={paginatedProducts}
            placeholderRowCount={placeholderRowCount}
            minDisplayRows={minDisplayRows}
            search={search}
            stockStatus={stockStatus}
            availableProducts={availableProducts}
            assignAction={assignAction}
            updateAction={updateAction}
            removeAction={removeAction}
          />
        </Card>

        {/* Pagination */}
        <InventoryPagination
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          nextCursor={nextCursor}
          prevCursor={prevCursor}
          currentCount={paginatedProducts.length}
          perPage={perPage}
          minDisplayRows={minDisplayRows}
        />
      </div>
    </InventoryLoadingProvider>
  );
}
