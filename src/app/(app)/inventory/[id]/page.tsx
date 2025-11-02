import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Archive,
  History,
  ArrowRight,
} from "lucide-react";
import { Prisma } from "@prisma/client";
import { AssignmentFilters } from "./AssignmentFilters";
import { AssignmentTableHeader } from "./AssignmentTableHeader";
import { AssignmentPagination } from "./AssignmentPagination";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

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

  const product = await db.product.findUnique({
    where: { id },
    include: {
      jobUsage: {
        include: {
          job: {
            include: {
              employee: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      },
    },
  });

  if (!product) {
    redirect("/inventory");
  }

  // Parse search params for cursor-based pagination
  const cursor = (resolvedSearchParams.cursor as string) || null;
  const direction = (resolvedSearchParams.direction as string) || null;
  const perPage = Number(resolvedSearchParams.perPage) || 10;
  const search = (resolvedSearchParams.search as string) || "";
  const sortBy = (resolvedSearchParams.sortBy as string) || "assignedAt";
  const sortOrder = (resolvedSearchParams.sortOrder as string) || "desc";

  // Build where clause for employee assignments
  const assignmentsWhere: Prisma.EmployeeProductWhereInput = {
    productId: id,
  };

  // Search filter
  if (search) {
    assignmentsWhere.OR = [
      { employee: { name: { contains: search, mode: "insensitive" } } },
      { employee: { email: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build orderBy clause
  let orderBy: any;
  switch (sortBy) {
    case "employeeName":
      orderBy = { employee: { name: sortOrder } };
      break;
    case "quantity":
      orderBy = { quantity: sortOrder };
      break;
    case "assignedAt":
      orderBy = { assignedAt: sortOrder };
      break;
    default:
      orderBy = { assignedAt: "desc" };
  }

  // Cursor-based pagination for employee assignments
  const take = perPage + 1;
  let employeeAssignments;

  if (cursor && direction === "next") {
    employeeAssignments = await db.employeeProduct.findMany({
      where: assignmentsWhere,
      include: { employee: true },
      orderBy,
      take,
      skip: 1,
      cursor: { id: cursor },
    });
  } else if (cursor && direction === "prev") {
    const reverseOrder: any = {};
    if (sortBy === "employeeName") {
      reverseOrder.employee = { name: sortOrder === "asc" ? "desc" : "asc" };
    } else if (sortBy === "quantity") {
      reverseOrder.quantity = sortOrder === "asc" ? "desc" : "asc";
    } else {
      reverseOrder.assignedAt = sortOrder === "asc" ? "desc" : "asc";
    }

    employeeAssignments = await db.employeeProduct.findMany({
      where: assignmentsWhere,
      include: { employee: true },
      orderBy: reverseOrder,
      take,
      skip: 1,
      cursor: { id: cursor },
    });
    employeeAssignments = employeeAssignments.reverse();
  } else {
    employeeAssignments = await db.employeeProduct.findMany({
      where: assignmentsWhere,
      include: { employee: true },
      orderBy,
      take,
    });
  }

  // Check if there are more pages
  const hasNextPage = employeeAssignments.length > perPage;
  if (hasNextPage) {
    employeeAssignments.pop();
  }

  const hasPrevPage = Boolean(cursor);
  const nextCursor = hasNextPage
    ? employeeAssignments[employeeAssignments.length - 1]?.id
    : null;
  const prevCursor = employeeAssignments[0]?.id || null;

  // Get all assignments for totals calculation
  const allAssignments = await db.employeeProduct.findMany({
    where: { productId: id },
  });

  // Calculate total quantity assigned to employees
  const totalAssigned = allAssignments.reduce(
    (sum: number, ep: any) => sum + ep.quantity,
    0
  );

  // Calculate usage statistics
  const totalUsed = (product as any).jobUsage.reduce(
    (sum: number, usage: any) => sum + usage.quantity,
    0
  );

  // Calculate minimum rows for display
  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(
    0,
    minDisplayRows - employeeAssignments.length
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Link href="/inventory">
        <Button variant="alara" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>
      </Link>
      <Card variant="ghost" className="py-6 px-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-[450] text-neutral-950">
              {product.name}
            </h1>
            {product.stockLevel <= product.minStock && (
              <Badge variant="error" size="md">
                Low Stock
              </Badge>
            )}
          </div>
          {product.description && (
            <p className="text-neutral-950/60 mt-2">{product.description}</p>
          )}
        </div>
      </Card>

      {/* Key Metrics */}
      <h2 className="text-lg font-[450] text-neutral-950">
        Inventory Overview
      </h2>
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          variant={product.stockLevel <= product.minStock ? "error" : "default"}
          className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 ${
                product.stockLevel <= product.minStock
                  ? "bg-red-50"
                  : "bg-neutral-950/10"
              } rounded-lg`}>
              <Archive
                className={`w-5 h-5 ${
                  product.stockLevel <= product.minStock
                    ? "text-red-600"
                    : "text-neutral-950"
                }`}
              />
            </div>
            <div
              className={`text-sm font-[450] ${
                product.stockLevel <= product.minStock
                  ? "text-red-600"
                  : "text-neutral-950/70"
              }`}>
              In Warehouse
            </div>
          </div>
          <div
            className={`text-2xl font-[450] ${
              product.stockLevel <= product.minStock
                ? "text-red-600"
                : "text-neutral-950"
            }`}>
            {product.stockLevel} {product.unit}
          </div>
        </Card>

        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <Users className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-sm font-[450] text-neutral-950">Assigned</div>
          </div>
          <div className="text-2xl font-[450] text-neutral-950">
            {totalAssigned} {product.unit}
          </div>
        </Card>

        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <Package className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-sm font-[450] text-neutral-950/70">Total</div>
          </div>
          <div className="text-2xl font-[450] text-neutral-950">
            {(product.stockLevel + totalAssigned).toFixed(2)} {product.unit}
          </div>
          <p className="text-xs text-neutral-950/60 mt-1">
            Warehouse + Assigned
          </p>
        </Card>

        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-sm font-[450] text-neutral-950/70">
              Cost/Unit
            </div>
          </div>
          <div className="text-2xl font-[450] text-neutral-950">
            ${product.costPerUnit.toFixed(2)}
          </div>
        </Card>

        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-neutral-950" />
            </div>
            <div className="text-sm font-[450] text-neutral-950/70">
              Total Value
            </div>
          </div>
          <div className="text-2xl font-[450] text-neutral-950">
            $
            {(
              (product.stockLevel + totalAssigned) *
              product.costPerUnit
            ).toFixed(2)}
          </div>
          <p className="text-xs text-neutral-950/60 mt-1">
            Warehouse + Assigned
          </p>
        </Card>
      </div>

      {/* Grid for Recent Usage and Stock Info */}
      <h2 className="text-lg font-[450] text-neutral-950 mt-12">
        Usage & Stock Details
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Usage */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <History className="w-5 h-5 text-neutral-950" />
            </div>
            <h2 className="text-lg font-[450] text-neutral-950">
              Recent Usage in Jobs
            </h2>
          </div>

          {(product as any).jobUsage.length === 0 ? (
            <p className="text-neutral-950/70 text-center py-4">
              No usage recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-2xl overflow-hidden">
                <thead className="bg-neutral-950/10 ">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-950/5">
                  {(product as any).jobUsage.map((usage: any) => (
                    <tr
                      key={usage.id}
                      className="hover:bg-neutral-950/2 transition-colors">
                      <td className="px-4 py-3 text-sm font-[450] text-neutral-950">
                        {usage.job.clientName}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-950/70">
                        {usage.job.employee.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-950/70">
                        {new Date(usage.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-[450] text-neutral-950 text-right">
                        {usage.quantity} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-neutral-950"
                          href={`/jobs/${usage.job.id}`}>
                          View Job <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stock Summary */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-950/10 rounded-lg">
              <Package className="w-5 h-5 text-neutral-950" />
            </div>
            <h2 className="text-lg font-[450] text-neutral-950">
              Stock Summary
            </h2>
          </div>

          <dl className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-950/10">
              <dt className="text-sm text-neutral-950/70">
                Minimum Stock Threshold
              </dt>
              <dd className="text-sm font-[450] text-neutral-950">
                {product.minStock} {product.unit}
              </dd>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-950/10">
              <dt className="text-sm text-neutral-950/70">
                Total Used in Jobs
              </dt>
              <dd className="text-sm font-[450] text-neutral-950">
                {totalUsed} {product.unit}
              </dd>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-950/5 border border-neutral-950/5 mt-2">
              <dt className="text-sm font-[450] text-neutral-950">Status</dt>
              <dd className="text-sm font-[450] text-neutral-950">
                {product.stockLevel <= product.minStock ? (
                  <Badge variant="error" size="sm">
                    Low Stock
                  </Badge>
                ) : (
                  <Badge variant="alara" size="sm">
                    In Stock
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Employee Assignments */}
      <h2 className="text-lg font-[450] text-neutral-950 mt-12">
        Employee Assignments
      </h2>
      {allAssignments.length === 0 ? (
        <Card variant="ghost" className="py-6">
          <div className="text-center py-8">
            <p className="text-neutral-950/70 mb-3">
              This product is not currently assigned to any employees.
            </p>
            <Button variant="alara" size="sm" href="/employees">
              Go to Employees to assign →
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="ghost" className="p-0">
          {/* Filters */}
          <AssignmentFilters />

          <div className="overflow-x-auto rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-neutral-950/5">
              <thead className="bg-neutral-950/10">
                <tr>
                  <AssignmentTableHeader
                    label="Employee"
                    sortKey="employeeName"
                  />
                  <th className="px-4 py-3 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                    Email
                  </th>
                  <AssignmentTableHeader label="Quantity" sortKey="quantity" />
                  <th className="px-4 py-3 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                    Value
                  </th>
                  <AssignmentTableHeader
                    label="Assigned Date"
                    sortKey="assignedAt"
                  />
                  <th className="px-4 py-3 text-left text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-[450] text-neutral-950/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-neutral-950/5">
                {employeeAssignments.length === 0 ? (
                  <>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-sm text-neutral-950/70">
                        {search
                          ? "No employee assignments found matching your filters."
                          : "No employee assignments found."}
                      </td>
                    </tr>
                    {/* Placeholder rows */}
                    {Array.from({ length: minDisplayRows - 1 }).map(
                      (_, idx) => (
                        <tr key={`placeholder-${idx}`} className="h-16">
                          {Array.from({ length: 7 }).map((_, colIdx) => (
                            <td key={colIdx} className="px-4 py-3"></td>
                          ))}
                        </tr>
                      )
                    )}
                  </>
                ) : (
                  <>
                    {employeeAssignments.map((assignment: any) => (
                      <tr
                        key={assignment.id}
                        className="hover:bg-neutral-950/3">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-[450] text-neutral-950">
                            {assignment.employee.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-950">
                          {assignment.employee.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-950">
                          {assignment.quantity} {product.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-[450] text-neutral-950">
                          $
                          {(assignment.quantity * product.costPerUnit).toFixed(
                            2
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-950/70">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-950/70">
                          {assignment.notes || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Button
                            variant="default"
                            className="text-neutral-950"
                            size="sm"
                            href={`/employees/${assignment.employee.id}`}>
                            View Employee{" "}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Placeholder rows to fill up to minimum display rows */}
                    {placeholderRowCount > 0 &&
                      Array.from({ length: placeholderRowCount }).map(
                        (_, idx) => (
                          <tr key={`placeholder-${idx}`} className="h-16">
                            {Array.from({ length: 7 }).map((_, colIdx) => (
                              <td key={colIdx} className="px-4 py-3"></td>
                            ))}
                          </tr>
                        )
                      )}
                  </>
                )}
              </tbody>
              <tfoot className="bg-neutral-950/10">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-[450] text-neutral-950">
                    Total Assigned
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-[450] text-neutral-950">
                    {totalAssigned} {product.unit}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-[450] text-neutral-950">
                    ${(totalAssigned * product.costPerUnit).toFixed(2)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          <AssignmentPagination
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            currentCount={employeeAssignments.length}
            perPage={perPage}
            minDisplayRows={minDisplayRows}
          />
        </Card>
      )}
    </div>
  );
}
