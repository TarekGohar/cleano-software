import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowLeft, ChevronLeft, Mail, Phone } from "lucide-react";
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
      assignedProducts: {
        include: {
          product: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
    },
  });

  if (!employee) {
    redirect("/employees");
  }

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

  const assignedProductIds = (employee as any).assignedProducts.map(
    (ap: any) => ap.productId
  );
  const availableProducts = allProducts.filter(
    (p) => !assignedProductIds.includes(p.id) && p.stockLevel > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button
        variant="ghost"
        size="sm"
        href="/employees"
        submit={false}
        className="!px-2 mb-4">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </Button>

      <Suspense fallback={<HeaderSkeleton />}>
        <Card variant="default" className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-full flex justify-between items-start space-y-3">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-[450] text-gray-900 mb-3">
                  <span className="text-gray-900">{employee.name}</span>
                  <Badge variant="alara" size="md">
                    {employee.role}
                  </Badge>
                </h1>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="default" className="p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-[450] text-gray-600">
                      Jobs Completed
                    </p>
                    <p className="text-3xl font-[450] text-gray-900">
                      {completedJobs.length}
                    </p>
                  </div>
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="default" className="p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-[450] text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-[450] text-green-600">
                      ${totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="default" className="p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-[450] text-gray-600">
                      Employee Pay
                    </p>
                    <p className="text-3xl font-[450] text-[#005F6A]">
                      ${totalPaid.toFixed(2)}
                    </p>
                    {totalTips > 0 && (
                      <p className="text-xs text-gray-500">
                        + ${totalTips.toFixed(2)} tips
                      </p>
                    )}
                  </div>
                </Card>
              </Suspense>

              <Suspense fallback={<MetricCardSkeleton />}>
                <Card variant="default" className="p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-[450] text-gray-600">
                      Unpaid Jobs
                    </p>
                    <p className="text-3xl font-[450] text-orange-600">
                      {unpaidJobs}
                    </p>
                  </div>
                </Card>
              </Suspense>
            </div>

            {/* Jobs Overview */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upcoming Jobs */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-[450] text-gray-900">
                      Upcoming Jobs
                    </h2>
                    <Badge variant="secondary" size="sm">
                      {upcomingJobs.length}
                    </Badge>
                  </div>

                  <Suspense fallback={<JobCardSkeleton />}>
                    {upcomingJobs.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">
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
                            className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5 !rounded-lg border border-gray-100">
                            <div className="w-full space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-[450] text-gray-900 text-left">
                                  {job.clientName}
                                </p>
                                <Badge variant="alara" size="sm">
                                  {job.jobType || "N/A"}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 text-left">
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
                                <p className="text-sm font-[450] text-green-600 text-left">
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-[450] text-gray-900">
                      Recent Jobs
                    </h2>
                    <Badge variant="secondary" size="sm">
                      Last 30 Days
                    </Badge>
                  </div>

                  <Suspense fallback={<JobCardSkeleton />}>
                    {recentJobs.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">
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
                            className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5 !rounded-lg border border-gray-100">
                            <div className="w-full space-y-2">
                              <div className="flex items-start justify-between">
                                <p className="font-[450] text-gray-900 text-left">
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
                              <p className="text-xs text-gray-600 text-left">
                                {new Date(job.startTime).toLocaleDateString()}
                              </p>
                              {job.price && (
                                <p className="text-sm font-[450] text-green-600 text-left">
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
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Products */}
              <Card variant="default" className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-[450] text-gray-900">
                    Most Used Products
                  </h2>

                  {topProducts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">
                        No usage data yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-[#005F6A]/5 rounded-lg border border-[#005F6A]/10 hover:border-[#005F6A]/20 transition-colors">
                          <div className="space-y-1">
                            <p className="font-[450] text-gray-900 text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-600">
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-[450] text-gray-900">
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
                      <p className="text-sm text-gray-500">
                        All products well-stocked! 🎉
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
                              <p className="font-[450] text-gray-900 text-sm text-left">
                                {product.name}
                              </p>
                              <Badge variant="error" size="sm">
                                Low
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 text-left">
                              Current: {product.stockLevel} {product.unit}
                            </p>
                            <p className="text-xs text-gray-600 text-left">
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

            {/* Inventory Requests */}
            <Card variant="default" className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-[450] text-gray-900">
                  Inventory Requests History
                </h2>

                {(employee as any).inventoryRequests.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">No requests yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(employee as any).inventoryRequests.map(
                          (request: any) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.quantity}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {request.reason || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant={
                                    request.status === "FULFILLED"
                                      ? "success"
                                      : request.status === "APPROVED"
                                      ? "secondary"
                                      : request.status === "REJECTED"
                                      ? "error"
                                      : "warning"
                                  }
                                  size="sm">
                                  {request.status}
                                </Badge>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </>
        }
        inventoryContent={
          <InventoryView
            employeeId={id}
            searchParams={resolvedSearchParams}
            assignedProducts={(employee as any).assignedProducts}
            availableProducts={availableProducts}
            assignAction={assignProduct.bind(null, id)}
            removeAction={unassignProduct}
            updateAction={updateProductQuantity}
          />
        }
      />
    </div>
  );
}
