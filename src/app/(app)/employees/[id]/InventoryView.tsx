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
  paginatedProducts: any[];
  allAssignedProducts: any[];
  availableProducts: any[];
  assignAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  minDisplayRows: number;
  placeholderRowCount: number;
  dataKey: string;
}

export async function InventoryView({
  employeeId,
  searchParams,
  paginatedProducts,
  allAssignedProducts,
  availableProducts,
  assignAction,
  removeAction,
  updateAction,
  hasNextPage,
  hasPrevPage,
  nextCursor,
  prevCursor,
  minDisplayRows,
  placeholderRowCount,
  dataKey,
}: InventoryViewProps) {
  // Parse search params for display purposes
  const perPage = Number(searchParams.perPage) || 10;
  const search = (searchParams.search as string) || "";
  const stockStatus = (searchParams.stockStatus as string) || "all";

  // Calculate metrics based on all assigned products (not just current page)
  const totalItems = allAssignedProducts.length;
  const totalQuantity = allAssignedProducts.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalValue = allAssignedProducts.reduce(
    (sum, item) => sum + item.quantity * (item.product.costPerUnit || 0),
    0
  );
  const lowStockItems = allAssignedProducts.filter(
    (item) => item.quantity <= (item.product.minStock || 0)
  ).length;

  return (
    <InventoryLoadingProvider>
      <InventoryClearLoading dataKey={dataKey} />
      <div className="space-y-6">
        {/* Inventory Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="alara_light_bordered" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-neutral-950/70">
                  Total Items
                </p>
                <p className="text-3xl font-[450] text-neutral-950">
                  {totalItems}
                </p>
              </div>
              <div className="p-3 bg-neutral-950/20 rounded-lg">
                <Package className="w-6 h-6 text-neutral-950" />
              </div>
            </div>
          </Card>

          <Card variant="alara_light_bordered" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-neutral-950/70">
                  Total Quantity
                </p>
                <p className="text-3xl font-[450] text-neutral-950">
                  {totalQuantity.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-neutral-950/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-neutral-950" />
              </div>
            </div>
          </Card>

          <Card variant="alara_light_bordered" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-neutral-950/70">
                  Total Value
                </p>
                <p className="text-3xl font-[450] text-neutral-950">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-neutral-950/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-neutral-950" />
              </div>
            </div>
          </Card>

          <Card variant="error" className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-[450] text-red-600">Low Stock</p>
                <p className="text-3xl font-[450] text-red-600">
                  {lowStockItems}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card variant="ghost">
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
