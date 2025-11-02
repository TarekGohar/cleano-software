import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  ChevronLeft,
  Mail,
  Phone,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Calendar,
  History,
  Package,
  FileText,
} from "lucide-react";
import { Suspense } from "react";
import {
  MetricCardSkeleton,
  JobCardSkeleton,
  ProductListSkeleton,
  HeaderSkeleton,
} from "./LoadingSkeleton";
import { ViewToggle, type ViewType } from "./ViewToggle";
import { InventoryView } from "./InventoryView";
import { InventoryViewSkeleton } from "./InventoryViewSkeleton";
import { ViewSwitcher } from "./ViewSwitcher";
import { Prisma } from "@prisma/client";

// Server Actions
async function assignProduct(employeeId: string, formData: FormData) {
  "use server";

  const assignmentsData = formData.get("assignmentsData") as string;

  if (assignmentsData) {
    const assignments = JSON.parse(assignmentsData);

    for (const assignment of assignments) {
      const { productId, quantity: quantityStr, notes } = assignment;
      const quantity = parseFloat(quantityStr);

      if (!productId || !quantity || quantity <= 0) continue;

      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.stockLevel < quantity) continue;

      const existing = await db.employeeProduct.findUnique({
        where: {
          employeeId_productId: {
            employeeId,
            productId,
          },
        },
      });

      if (existing) {
        await db.$transaction([
          db.employeeProduct.update({
            where: { id: existing.id },
            data: {
              quantity: { increment: quantity },
              notes: notes || existing.notes,
            },
          }),
          db.product.update({
            where: { id: productId },
            data: { stockLevel: { decrement: quantity } },
          }),
        ]);
      } else {
        await db.$transaction([
          db.employeeProduct.create({
            data: {
              employeeId,
              productId,
              quantity,
              notes: notes || null,
            },
          }),
          db.product.update({
            where: { id: productId },
            data: { stockLevel: { decrement: quantity } },
          }),
        ]);
      }
    }
  } else {
    const productId = formData.get("productId") as string;
    const quantity = parseFloat(formData.get("quantity") as string);
    const notes = formData.get("notes") as string;

    if (!productId || !quantity || quantity <= 0) return;

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.stockLevel < quantity) return;

    await db.$transaction([
      db.employeeProduct.create({
        data: {
          employeeId,
          productId,
          quantity,
          notes: notes || null,
        },
      }),
      db.product.update({
        where: { id: productId },
        data: { stockLevel: { decrement: quantity } },
      }),
    ]);
  }

  revalidatePath(`/employees/${employeeId}`);
}

async function unassignProduct(formData: FormData) {
  "use server";

  const assignmentId = formData.get("assignmentId") as string;
  const assignment = await db.employeeProduct.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) return;

  await db.$transaction([
    db.employeeProduct.delete({
      where: { id: assignmentId },
    }),
    db.product.update({
      where: { id: assignment.productId },
      data: { stockLevel: { increment: assignment.quantity } },
    }),
  ]);

  revalidatePath(`/employees/${assignment.employeeId}`);
}

async function updateProductQuantity(formData: FormData) {
  "use server";

  const assignmentId = formData.get("assignmentId") as string;
  const newQuantity = parseFloat(formData.get("quantity") as string);

  if (!newQuantity || newQuantity <= 0) return;

  const assignment = await db.employeeProduct.findUnique({
    where: { id: assignmentId },
    include: { product: true },
  });

  if (!assignment) return;

  const quantityDiff = newQuantity - assignment.quantity;

  if (quantityDiff > 0 && assignment.product.stockLevel < quantityDiff) {
    return;
  }

  await db.$transaction([
    db.employeeProduct.update({
      where: { id: assignmentId },
      data: { quantity: newQuantity },
    }),
    db.product.update({
      where: { id: assignment.productId },
      data: { stockLevel: { increment: -quantityDiff } },
    }),
  ]);

  revalidatePath(`/employees/${assignment.employeeId}`);
}

// Component exports
export default async function EmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const currentView: ViewType =
    (resolvedSearchParams.view as ViewType) || "overview";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "OWNER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const employee = await db.user.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          productUsage: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
      },
      inventoryRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!employee) {
    redirect("/employees");
  }

  // Parse inventory search params for cursor-based pagination
  const cursor = (resolvedSearchParams.cursor as string) || null;
  const direction = (resolvedSearchParams.direction as string) || null;
  const perPage = Number(resolvedSearchParams.perPage) || 10;
  const search = (resolvedSearchParams.search as string) || "";
  const stockStatus = (resolvedSearchParams.stockStatus as string) || "all";
  const sortBy = (resolvedSearchParams.sortBy as string) || "name";
  const sortOrder = (resolvedSearchParams.sortOrder as string) || "asc";

  // Build where clause for assigned products
  const assignedWhere: Prisma.EmployeeProductWhereInput = {
    employeeId: id,
  };

  // Search filter
  if (search) {
    assignedWhere.OR = [
      { product: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  // Stock status filter - we'll apply this after fetching since it requires comparing quantities
  // For now, fetch all matching products
  
  // Build orderBy clause
  let orderBy: any;
  switch (sortBy) {
    case "name":
      orderBy = { product: { name: sortOrder } };
      break;
    case "quantity":
      orderBy = { quantity: sortOrder };
      break;
    case "assignedAt":
      orderBy = { assignedAt: sortOrder };
      break;
    case "value":
      // For value sorting, we need to sort by quantity * costPerUnit
      // This is complex in Prisma, so we'll fall back to assignedAt
      orderBy = { assignedAt: sortOrder };
      break;
    default:
      orderBy = { assignedAt: "desc" };
  }

  // Cursor-based pagination for assigned products
  const take = perPage + 1;
  let assignedProducts;

  if (cursor && direction === "next") {
    assignedProducts = await db.employeeProduct.findMany({
      where: assignedWhere,
      include: { product: true },
      orderBy,
      take,
      skip: 1,
      cursor: { id: cursor },
    });
  } else if (cursor && direction === "prev") {
    const reverseOrder: any = {};
    if (sortBy === "name") {
      reverseOrder.product = { name: sortOrder === "asc" ? "desc" : "asc" };
    } else if (sortBy === "quantity") {
      reverseOrder.quantity = sortOrder === "asc" ? "desc" : "asc";
    } else {
      reverseOrder.assignedAt = sortOrder === "asc" ? "desc" : "asc";
    }
    
    assignedProducts = await db.employeeProduct.findMany({
      where: assignedWhere,
      include: { product: true },
      orderBy: reverseOrder,
      take,
      skip: 1,
      cursor: { id: cursor },
    });
    assignedProducts = assignedProducts.reverse();
  } else {
    assignedProducts = await db.employeeProduct.findMany({
      where: assignedWhere,
      include: { product: true },
      orderBy,
      take,
    });
  }

  // Apply stock status filter on fetched data (client-side filtering)
  let filteredAssignedProducts = [...assignedProducts];
  if (stockStatus === "in-stock") {
    filteredAssignedProducts = filteredAssignedProducts.filter(
      (item) => item.quantity > (item.product.minStock || 0)
    );
  } else if (stockStatus === "low-stock") {
    filteredAssignedProducts = filteredAssignedProducts.filter(
      (item) =>
        item.quantity <= (item.product.minStock || 0) && item.quantity > 0
    );
  } else if (stockStatus === "out-of-stock") {
    filteredAssignedProducts = filteredAssignedProducts.filter(
      (item) => item.quantity === 0
    );
  }

  // Check if there are more pages
  const hasNextPage = filteredAssignedProducts.length > perPage;
  if (hasNextPage) {
    filteredAssignedProducts.pop();
  }

  const hasPrevPage = Boolean(cursor);
  const nextCursor = hasNextPage
    ? filteredAssignedProducts[filteredAssignedProducts.length - 1]?.id
    : null;
  const prevCursor = filteredAssignedProducts[0]?.id || null;

  // Get all assigned products for metrics (unfiltered)
  const allAssignedProducts = await db.employeeProduct.findMany({
    where: { employeeId: id },
    include: { product: true },
  });

  const now = new Date();
  const completedJobs = employee.jobs.filter(
    (j: any) => j.status === "COMPLETED"
  );
  const upcomingJobs = employee.jobs
    .filter(
      (j: any) => j.status === "IN_PROGRESS" && new Date(j.startTime) > now
    )
    .slice(0, 5);
  const recentJobs = employee.jobs
    .filter(
      (j: any) =>
        j.status === "COMPLETED" &&
        new Date(j.startTime) >
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    )
    .slice(0, 5);

  const totalRevenue = completedJobs.reduce(
    (sum: number, job: any) => sum + (job.price || 0),
    0
  );
  const totalPaid = completedJobs.reduce(
    (sum: number, job: any) => sum + (job.employeePay || 0),
    0
  );
  const totalTips = completedJobs.reduce(
    (sum: number, job: any) => sum + (job.totalTip || 0),
    0
  );
  const unpaidJobs = completedJobs.filter(
    (j: any) => !j.paymentReceived
  ).length;

  const productUsageMap = new Map<
    string,
    { name: string; quantity: number; unit: string }
  >();
  employee.jobs.forEach((job: any) => {
    job.productUsage.forEach((usage: any) => {
      const existing = productUsageMap.get(usage.product.id);
      if (existing) {
        existing.quantity += usage.quantity;
      } else {
        productUsageMap.set(usage.product.id, {
          name: usage.product.name,
          quantity: usage.quantity,
          unit: usage.product.unit,
        });
      }
    });
  });

  const topProducts = Array.from(productUsageMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const allProducts = await db.product.findMany({
    orderBy: { stockLevel: "asc" },
  });

  const lowStockProducts = allProducts.filter(
    (p) => p.stockLevel <= p.minStock
  );

  const assignedProductIds = allAssignedProducts.map((ap) => ap.productId);
  const availableProducts = allProducts.filter(
    (p) => !assignedProductIds.includes(p.id) && p.stockLevel > 0
  );

  // Calculate minimum rows for display
  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(
    0,
    minDisplayRows - filteredAssignedProducts.length
  );

  // Create data key for loading state
  const dataKey = `${cursor}-${search}-${stockStatus}-${sortBy}-${sortOrder}-${perPage}-${filteredAssignedProducts.length}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Button
        variant="alara"
        size="sm"
        href="/employees"
        submit={false}
        className="!px-2 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </Button>

      <Suspense fallback={<HeaderSkeleton />}>
        <Card variant="ghost" className="py-6">
          <div className="flex items-start justify-between">
            <div className="w-full flex justify-between items-start space-y-3">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-[450] text-[#005F6A] mb-3">
                  <span className="text-[#005F6A]">{employee.name}</span>
                  <Badge variant="alara" size="md">
                    {employee.role}
                  </Badge>
                </h1>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#005F6A]/70">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-[#005F6A]/70">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <ViewToggle currentView={currentView} />
            </div>
          </div>
        </Card>
      </Suspense>

      {/* Conditional View Rendering */}
      <ViewSwitcher
        currentView={currentView}
        overviewContent={
          <>
            {/* Key Metrics */}
            <h2 className="text-lg font-[450] text-[#005F6A]">
              Performance Overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="alara_light_bordered" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <div className="text-sm font-[450] text-[#005F6A]/70">
                      Jobs Completed
                    </div>
                  </div>
                  <div className="text-2xl font-[450] text-[#005F6A]">
                    {completedJobs.length}
                  </div>
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="alara_light_bordered" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <div className="text-sm font-[450] text-[#005F6A]/70">
                      Total Revenue
                    </div>
                  </div>
                  <div className="text-2xl font-[450] text-[#005F6A]">
                    ${totalRevenue.toFixed(2)}
                  </div>
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="alara_light_bordered" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <div className="text-sm font-[450] text-[#005F6A]/70">
                      Employee Pay
                    </div>
                  </div>
                  <div className="text-2xl font-[450] text-[#005F6A]">
                    ${totalPaid.toFixed(2)}
                  </div>
                  {totalTips > 0 && (
                    <p className="text-xs text-[#005F6A]/60 mt-1">
                      + ${totalTips.toFixed(2)} tips
                    </p>
                  )}
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="alara_light_bordered" className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <div className="text-sm font-[450] text-[#005F6A]/70">
                      Unpaid Jobs
                    </div>
                  </div>
                  <div className="text-2xl font-[450] text-[#005F6A]">
                    {unpaidJobs}
                  </div>
                </Card>
              </Suspense>
            </div>

            {/* Jobs Overview */}
            <h2 className="text-lg font-[450] text-[#005F6A] mt-12">Jobs</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upcoming Jobs */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <h2 className="text-lg font-[450] text-[#005F6A]">
                      Upcoming Jobs
                    </h2>
                    <Badge variant="alara" size="sm">
                      {upcomingJobs.length}
                    </Badge>
                  </div>

                  <Suspense fallback={<JobCardSkeleton />}>
                    {upcomingJobs.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-[#005F6A]/60">
                          No upcoming jobs.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingJobs.map((job: any) => (
                          <Button
                            key={job.id}
                            variant="ghost"
                            size="md"
                            href={`/jobs/${job.id}`}
                            submit={false}
                            className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5 !rounded-lg border border-[#005F6A]/10">
                            <div className="w-full space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-[450] text-[#005F6A] text-left">
                                  {job.clientName}
                                </p>
                                <Badge variant="alara" size="sm">
                                  {job.jobType || "N/A"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#005F6A]/60 text-left">
                                {new Date(job.startTime).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(job.startTime).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                              {job.price && (
                                <p className="text-sm font-[450] text-[#005F6A] text-left">
                                  ${job.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </Suspense>
                </div>
              </Card>

              {/* Recent Jobs */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <History className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <h2 className="text-lg font-[450] text-[#005F6A]">
                      Recent Jobs
                    </h2>
                    <Badge variant="alara" size="sm">
                      Last 30 Days
                    </Badge>
                  </div>

                  <Suspense fallback={<JobCardSkeleton />}>
                    {recentJobs.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-[#005F6A]/60">
                          No jobs in the last 30 days.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentJobs.map((job: any) => (
                          <Button
                            key={job.id}
                            variant="ghost"
                            size="md"
                            href={`/jobs/${job.id}`}
                            submit={false}
                            className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5 !rounded-lg border border-[#005F6A]/10">
                            <div className="w-full space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-[450] text-[#005F6A] text-left">
                                  {job.clientName}
                                </p>
                                <Badge
                                  variant={
                                    job.paymentReceived ? "success" : "warning"
                                  }
                                  size="sm">
                                  {job.paymentReceived ? "Paid" : "Unpaid"}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#005F6A]/60 text-left">
                                {new Date(job.startTime).toLocaleDateString()}
                              </p>
                              {job.price && (
                                <p className="text-sm font-[450] text-[#005F6A] text-left">
                                  ${job.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                  </Suspense>
                </div>
              </Card>
            </div>

            {/* Analytics Section */}
            <h2 className="text-lg font-[450] text-[#005F6A] mt-12">
              Analytics
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Products */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <Package className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <h2 className="text-lg font-[450] text-[#005F6A]">
                      Most Used Products
                    </h2>
                  </div>

                  {topProducts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-[#005F6A]/60">
                        No usage data yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-[#77C8CC]/10 rounded-lg border border-[#005F6A]/10 hover:border-[#005F6A]/20 transition-colors">
                          <div className="space-y-1">
                            <p className="font-[450] text-[#005F6A] text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#005F6A]/60">
                              {product.quantity} {product.unit}
                            </p>
                          </div>
                          <Badge variant="alara" size="sm">
                            #{idx + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Low Stock Alerts */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-[#005F6A]" />
                    </div>
                    <h2 className="text-lg font-[450] text-[#005F6A]">
                      Low Stock Alerts
                    </h2>
                    {lowStockProducts.length > 0 && (
                      <Badge variant="warning" size="sm">
                        {lowStockProducts.length}
                      </Badge>
                    )}
                  </div>

                  {lowStockProducts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-[#005F6A]/60">
                        All products well-stocked!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lowStockProducts.map((product) => (
                        <Button
                          key={product.id}
                          variant="ghost"
                          size="md"
                          href={`/inventory/${product.id}`}
                          submit={false}
                          className="w-full !justify-start !h-auto !py-3 hover:bg-red-50 border border-red-200 !rounded-lg">
                          <div className="w-full space-y-1">
                            <div className="flex items-start justify-between">
                              <p className="font-[450] text-[#005F6A] text-sm text-left">
                                {product.name}
                              </p>
                              <Badge variant="error" size="sm">
                                Low
                              </Badge>
                            </div>
                            <p className="text-xs text-[#005F6A]/60 text-left">
                              Current: {product.stockLevel} {product.unit}
                            </p>
                            <p className="text-xs text-[#005F6A]/60 text-left">
                              Min: {product.minStock} {product.unit}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        }
        inventoryContent={
          <InventoryView
            employeeId={id}
            searchParams={resolvedSearchParams}
            paginatedProducts={filteredAssignedProducts}
            allAssignedProducts={allAssignedProducts}
            availableProducts={availableProducts}
            assignAction={assignProduct.bind(null, id)}
            removeAction={unassignProduct}
            updateAction={updateProductQuantity}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            minDisplayRows={minDisplayRows}
            placeholderRowCount={placeholderRowCount}
            dataKey={dataKey}
          />
        }
      />
    </div>
  );
}
