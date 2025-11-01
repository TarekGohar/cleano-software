import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Card from "@/components/ui/Card";
import { Prisma } from "@prisma/client";
import { ProductFilters } from "./InventoryFilters";
import { ProductPagination } from "./InventoryPagination";
import { TableHeader } from "./TableHeader";
import { TableLoadingOverlay } from "./TableLoadingOverlay";
import { ProductLoadingProvider } from "./InventoryLoadingContext";
import { ClearLoadingOnMount } from "./ClearLoadingOnMount";
import { ProductModalProvider, CreateProductButton } from "./InventoryClient";
import { ProductRow } from "./InventoryRow";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Admin only - OWNER or ADMIN
  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;
  const cursor = (params.cursor as string) || null;
  const direction = (params.direction as string) || null;
  const perPage = Number(params.perPage) || 10;
  const search = (params.search as string) || "";
  const status = (params.status as string) || "all";
  const sortBy = (params.sortBy as string) || "name";
  const sortOrder = (params.sortOrder as string) || "asc";

  // Build where clause
  const where: Prisma.ProductWhereInput = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Cursor-based pagination
  const take = perPage + 1; // Fetch one extra to check if there's a next page
  const orderBy: any = { [sortBy]: sortOrder };

  let products;

  if (cursor && direction === "next") {
    // Next page
    products = await db.product.findMany({
      where,
      include: {
        employeeProducts: {
          include: {
            employee: true,
          },
        },
      },
      orderBy,
      take,
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    });
  } else if (cursor && direction === "prev") {
    // Previous page - reverse the order
    const reverseOrder: any = {
      [sortBy]: sortOrder === "asc" ? "desc" : "asc",
    };
    products = await db.product.findMany({
      where,
      include: {
        employeeProducts: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: reverseOrder,
      take,
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    });
    // Reverse the results back to correct order
    products = products.reverse();
  } else {
    // First page
    products = await db.product.findMany({
      where,
      include: {
        employeeProducts: {
          include: {
            employee: true,
          },
        },
      },
      orderBy,
      take,
    });
  }

  // Check if there are more pages
  const hasNextPage = products.length > perPage;
  if (hasNextPage) {
    products.pop(); // Remove the extra item
  }

  // Check if there's a previous page (we have a cursor and we're not on the first page)
  const hasPrevPage = Boolean(cursor);

  // Get cursors for pagination
  const nextCursor = hasNextPage ? products[products.length - 1]?.id : null;
  const prevCursor = products[0]?.id || null;

  // Calculate stats for each product
  let productsWithStats = products.map((product) => {
    const employeeProducts = product.employeeProducts || [];
    const totalAssigned = employeeProducts.reduce(
      (sum, ep) => sum + ep.quantity,
      0
    );
    const employeeCount = employeeProducts.length;

    return {
      ...product,
      totalAssigned,
      employeeCount,
      totalInventory: product.stockLevel + totalAssigned,
      isLowStock: product.stockLevel <= product.minStock,
    };
  });

  // Apply status filter (client-side for calculated fields)
  if (status === "low-stock") {
    productsWithStats = productsWithStats.filter((p) => p.isLowStock);
  } else if (status === "in-stock") {
    productsWithStats = productsWithStats.filter((p) => !p.isLowStock);
  }

  // Calculate minimum rows to display based on perPage
  // If perPage <= 10, use perPage as minimum, otherwise use 10 as minimum
  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(
    0,
    minDisplayRows - productsWithStats.length
  );

  // Create a unique key based on search params to detect data changes
  const dataKey = `${cursor}-${search}-${status}-${sortBy}-${sortOrder}-${perPage}-${productsWithStats.length}`;

  return (
    <ProductLoadingProvider>
      <ProductModalProvider>
        <ClearLoadingOnMount dataKey={dataKey} />
        <div className="space-y-6">
          {/* Header */}
          <Card variant="ghost">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-[450] text-gray-900">Inventory</h1>
              <CreateProductButton />
            </div>
          </Card>

          {/* Search and Filters */}
          <ProductFilters />

          {/* Products Table */}
          <Card variant="default">
            <div className="overflow-hidden rounded-lg relative">
              <TableLoadingOverlay />
              <div className="overflow-x-auto">
                {/* Header row */}
                <div className="grid grid-cols-7 bg-gray-50/50">
                  <TableHeader label="Name" sortKey="name" />
                  <span className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider flex items-center">
                    Description
                  </span>
                  <TableHeader label="Stock Level" sortKey="stockLevel" />
                  <span className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider flex items-center">
                    Assigned
                  </span>
                  <span className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider flex items-center">
                    Employees
                  </span>
                  <span className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider flex items-center">
                    Status
                  </span>
                  <span className="px-6 py-3 text-right text-xs font-[450] text-gray-500 uppercase tracking-wider flex items-center justify-end">
                    Actions
                  </span>
                </div>
                {/* Products - Fixed height for 10 rows */}
                <div className="bg-white divide-y divide-gray-50 relative">
                  {productsWithStats.length === 0 ? (
                    <>
                      <div className="px-6 py-8 text-center text-sm text-gray-500">
                        {search || status !== "all"
                          ? "No products found matching your filters."
                          : "No products found."}
                      </div>
                      {/* Placeholder rows */}
                      {Array.from({ length: minDisplayRows - 1 }).map(
                        (_, idx) => (
                          <div
                            key={`placeholder-${idx}`}
                            className="grid grid-cols-7 h-16">
                            {Array.from({ length: 7 }).map((_, colIdx) => (
                              <div key={colIdx} className="px-6 py-4"></div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      {productsWithStats.map((product) => (
                        <ProductRow key={product.id} product={product} />
                      ))}
                      {/* Placeholder rows to fill up to minimum display rows */}
                      {placeholderRowCount > 0 &&
                        Array.from({ length: placeholderRowCount }).map(
                          (_, idx) => (
                            <div
                              key={`placeholder-${idx}`}
                              className="grid grid-cols-7 h-16">
                              {Array.from({ length: 7 }).map((_, colIdx) => (
                                <div key={colIdx} className="px-6 py-4"></div>
                              ))}
                            </div>
                          )
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Pagination */}
          <ProductPagination
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            currentCount={productsWithStats.length}
            perPage={perPage}
            minDisplayRows={minDisplayRows}
          />
        </div>
      </ProductModalProvider>
    </ProductLoadingProvider>
  );
}
