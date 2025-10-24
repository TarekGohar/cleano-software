import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Prisma } from "@prisma/client";
import { ProductFilters } from "./ProductFilters";
import { ProductPagination } from "./ProductPagination";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function ProductsPage({
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

  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;
  const page = Number(params.page) || 1;
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

  // Fetch products with pagination
  const [products, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        employeeProducts: {
          include: {
            employee: true,
          },
        },
      } as any,
      orderBy: { [sortBy]: sortOrder } as any,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.product.count({ where }),
  ]);

  // Calculate stats for each product
  const productsWithStats = products.map((product) => {
    const employeeProducts = (product as any).employeeProducts || [];
    const totalAssigned = employeeProducts.reduce(
      (sum: number, ep: any) => sum + ep.quantity,
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

  // Filter by status (client-side for calculated fields)
  let filteredProducts = productsWithStats;
  if (status === "low-stock") {
    filteredProducts = productsWithStats.filter((p) => p.isLowStock);
  } else if (status === "in-stock") {
    filteredProducts = productsWithStats.filter((p) => !p.isLowStock);
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-cyan-800">Products</h1>
          <Button variant="primary" size="md" href="/products/new">
            Add Product
          </Button>
        </div>
      </Card>

      {/* Search and Filters */}
      <ProductFilters />

      {/* Products Table */}
      <Card variant="default">
        <div className="overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500">
                      {search || status !== "all"
                        ? "No products found matching your filters."
                        : "No products found. Add your first product to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stockLevel} {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.totalAssigned > 0 ? (
                          <span className="text-[#005F6A] font-medium">
                            {product.totalAssigned} {product.unit}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stockLevel <= product.minStock ? (
                          <Badge variant="error" size="sm">
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            In Stock
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            href={`/products/${product.id}`}>
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            href={`/products/${product.id}/edit`}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Pagination */}
      <ProductPagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
      />
    </div>
  );
}
