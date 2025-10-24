import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProductAssignmentForm from "./ProductAssignmentForm";
import InventoryItem from "./InventoryItem";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Admin only - OWNER or ADMIN
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

  type JobWithUsage = (typeof employee.jobs)[0];

  // Calculate various metrics
  const now = new Date();
  const completedJobs = employee.jobs.filter(
    (j: any) => j.status === "COMPLETED"
  );
  const upcomingJobs = employee.jobs.filter(
    (j: any) => j.status === "IN_PROGRESS" && new Date(j.startTime) > now
  );
  const recentJobs = employee.jobs.filter(
    (j: any) =>
      j.status === "COMPLETED" &&
      new Date(j.startTime) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  );

  // Financial metrics
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
  const totalParking = completedJobs.reduce(
    (sum: number, job: any) => sum + (job.parking || 0),
    0
  );
  const unpaidJobs = completedJobs.filter(
    (j: any) => !j.paymentReceived
  ).length;

  // Product usage analytics
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

  // Get all products to show low stock warnings
  const allProducts = await db.product.findMany({
    orderBy: { stockLevel: "asc" },
  });

  const lowStockProducts = allProducts.filter(
    (p) => p.stockLevel <= p.minStock
  );

  // Get available products for assignment (not already assigned to this employee)
  const assignedProductIds = (employee as any).assignedProducts.map(
    (ap: any) => ap.productId
  );
  const availableProducts = allProducts.filter(
    (p) => !assignedProductIds.includes(p.id) && p.stockLevel > 0
  );

  // Server actions
  async function assignProduct(formData: FormData) {
    "use server";

    // Check if this is a bulk assignment
    const assignmentsData = formData.get("assignmentsData") as string;

    if (assignmentsData) {
      // Handle multiple products
      const assignments = JSON.parse(assignmentsData);

      for (const assignment of assignments) {
        const { productId, quantity: quantityStr, notes } = assignment;
        const quantity = parseFloat(quantityStr);

        if (!productId || !quantity || quantity <= 0) {
          continue;
        }

        // Check if product has enough stock
        const product = await db.product.findUnique({
          where: { id: productId },
        });

        if (!product || product.stockLevel < quantity) {
          continue;
        }

        // Check if already assigned
        const existing = await db.employeeProduct.findUnique({
          where: {
            employeeId_productId: {
              employeeId: id,
              productId,
            },
          },
        });

        if (existing) {
          // Update existing assignment
          await db.$transaction([
            db.employeeProduct.update({
              where: { id: existing.id },
              data: {
                quantity: {
                  increment: quantity,
                },
                notes: notes || existing.notes,
              },
            }),
            db.product.update({
              where: { id: productId },
              data: {
                stockLevel: {
                  decrement: quantity,
                },
              },
            }),
          ]);
        } else {
          // Create new assignment
          await db.$transaction([
            db.employeeProduct.create({
              data: {
                employeeId: id,
                productId,
                quantity,
                notes: notes || null,
              },
            }),
            db.product.update({
              where: { id: productId },
              data: {
                stockLevel: {
                  decrement: quantity,
                },
              },
            }),
          ]);
        }
      }
    } else {
      // Handle single product (legacy support)
      const productId = formData.get("productId") as string;
      const quantity = parseFloat(formData.get("quantity") as string);
      const notes = formData.get("notes") as string;

      if (!productId || !quantity || quantity <= 0) {
        return;
      }

      // Check if product has enough stock
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.stockLevel < quantity) {
        return;
      }

      // Create assignment and update stock
      await db.$transaction([
        db.employeeProduct.create({
          data: {
            employeeId: id,
            productId,
            quantity,
            notes: notes || null,
          },
        }),
        db.product.update({
          where: { id: productId },
          data: {
            stockLevel: {
              decrement: quantity,
            },
          },
        }),
      ]);
    }

    revalidatePath(`/employees/${id}`);
  }

  async function unassignProduct(formData: FormData) {
    "use server";

    const assignmentId = formData.get("assignmentId") as string;

    const assignment = await db.employeeProduct.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return;
    }

    // Delete assignment and return stock
    await db.$transaction([
      db.employeeProduct.delete({
        where: { id: assignmentId },
      }),
      db.product.update({
        where: { id: assignment.productId },
        data: {
          stockLevel: {
            increment: assignment.quantity,
          },
        },
      }),
    ]);

    revalidatePath(`/employees/${id}`);
  }

  async function updateProductQuantity(formData: FormData) {
    "use server";

    const assignmentId = formData.get("assignmentId") as string;
    const newQuantity = parseFloat(formData.get("quantity") as string);

    if (!newQuantity || newQuantity <= 0) {
      return;
    }

    const assignment = await db.employeeProduct.findUnique({
      where: { id: assignmentId },
      include: { product: true },
    });

    if (!assignment) {
      return;
    }

    const quantityDiff = newQuantity - assignment.quantity;

    // Check if product has enough stock for increase
    if (quantityDiff > 0 && assignment.product.stockLevel < quantityDiff) {
      return;
    }

    // Update assignment and adjust stock
    await db.$transaction([
      db.employeeProduct.update({
        where: { id: assignmentId },
        data: { quantity: newQuantity },
      }),
      db.product.update({
        where: { id: assignment.productId },
        data: {
          stockLevel: {
            increment: -quantityDiff, // negative if quantity increased, positive if decreased
          },
        },
      }),
    ]);

    revalidatePath(`/employees/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            href="/employees"
            submit={false}
            className="!px-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Employees
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <p>{employee.email}</p>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <p>{employee.phone}</p>
                </div>
              )}
              <Badge variant="alara" size="md" className="mt-3">
                {employee.role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="default">
          <div className="pt-4">
            <div className="text-2xl font-bold text-gray-900">
              {completedJobs.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Jobs Completed</p>
          </div>
        </Card>

        <Card variant="default">
          <div className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Total Revenue Generated
            </p>
          </div>
        </Card>

        <Card variant="default">
          <div className="pt-4">
            <div className="text-2xl font-bold text-[#005F6A]">
              ${totalPaid.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Paid to Employee</p>
            {totalTips > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                + ${totalTips.toFixed(2)} in tips
              </p>
            )}
          </div>
        </Card>

        <Card variant="default">
          <div className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {unpaidJobs}
            </div>
            <p className="text-sm text-gray-600 mt-1">Unpaid Jobs</p>
          </div>
        </Card>
      </div>

      {/* Jobs Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Jobs */}
        <Card variant="default">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Upcoming Jobs ({upcomingJobs.length})
            </h2>

            {upcomingJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No upcoming jobs scheduled.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.slice(0, 5).map((job: any) => (
                  <Button
                    key={job.id}
                    variant="ghost"
                    size="md"
                    href={`/jobs/${job.id}`}
                    submit={false}
                    className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5">
                    <div className="w-full text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {job.clientName}
                        </div>
                        <Badge variant="alara" size="sm">
                          {job.jobType || "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(job.startTime).toLocaleDateString()} at{" "}
                          {new Date(job.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.price && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600 mt-2">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>${job.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Jobs */}
        <Card variant="default">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Jobs (Last 30 Days)
            </h2>

            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No jobs completed in the last 30 days.
              </p>
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 5).map((job: any) => (
                  <Button
                    key={job.id}
                    variant="ghost"
                    size="md"
                    href={`/jobs/${job.id}`}
                    submit={false}
                    className="w-full !justify-start !h-auto !py-3 hover:bg-[#005F6A]/5">
                    <div className="w-full text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {job.clientName}
                        </div>
                        <Badge
                          variant={job.paymentReceived ? "success" : "warning"}
                          size="sm">
                          {job.paymentReceived ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(job.startTime).toLocaleDateString()}
                      </div>
                      {job.price && (
                        <div className="text-sm font-medium text-green-600 mt-1">
                          ${job.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Employee Inventory Management */}
      <Card variant="default">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Assigned Inventory
            </h2>
            {(employee as any).assignedProducts.length > 0 && (
              <Badge variant="alara" size="sm">
                {(employee as any).assignedProducts.length}
              </Badge>
            )}
          </div>

          {/* Assign New Product Form */}
          {availableProducts.length > 0 && (
            <ProductAssignmentForm
              availableProducts={availableProducts}
              assignAction={assignProduct}
            />
          )}

          {/* Assigned Products List */}
          {(employee as any).assignedProducts.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">
              No products assigned yet.
            </p>
          ) : (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Current Inventory ({(employee as any).assignedProducts.length})
              </h4>
              {(employee as any).assignedProducts.map((assignment: any) => (
                <InventoryItem
                  key={assignment.id}
                  assignment={assignment}
                  updateAction={updateProductQuantity}
                  removeAction={unassignProduct}
                />
              ))}
            </div>
          )}

          {availableProducts.length === 0 &&
            (employee as any).assignedProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-3">
                  No products available in inventory.
                </p>
                <Button variant="default" size="sm" href="/products">
                  Manage Products →
                </Button>
              </div>
            )}
        </div>
      </Card>

      {/* Product Usage & Inventory */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products Used */}
        <Card variant="default">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Most Used Products
            </h2>

            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No product usage recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-[#005F6A]/5 rounded-lg hover:bg-[#005F6A]/10 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.quantity} {product.unit}
                      </div>
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

        {/* Low Stock Alert */}
        <Card variant="default">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Low Stock Alerts
              </h2>
              {lowStockProducts.length > 0 && (
                <Badge variant="warning" size="sm">
                  {lowStockProducts.length}
                </Badge>
              )}
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                All products are well-stocked! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="ghost"
                    size="md"
                    href={`/products/${product.id}`}
                    submit={false}
                    className="w-full !justify-start !h-auto !py-3 hover:bg-red-50 border border-red-200 !rounded-lg">
                    <div className="w-full text-left">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <Badge variant="error" size="sm">
                          Low
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Current: {product.stockLevel} {product.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        Min Required: {product.minStock} {product.unit}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Inventory Requests */}
      <Card variant="default">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Inventory Requests History
          </h2>

          {(employee as any).inventoryRequests.length === 0 ? (
            <p className="text-gray-500 text-sm">No requests submitted yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(employee as any).inventoryRequests.map((request: any) => (
                      <tr key={request.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {request.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {request.reason || "-"}
                        </td>
                        <td className="px-4 py-3">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Financial Breakdown */}
      <Card variant="default">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Financial Summary
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="alara_light_bordered">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toFixed(2)}
                </div>
              </div>
            </Card>

            <Card variant="alara_light_bordered">
              <div>
                <div className="text-sm text-gray-600 mb-1">Employee Pay</div>
                <div className="text-2xl font-bold text-[#005F6A]">
                  ${totalPaid.toFixed(2)}
                </div>
              </div>
            </Card>

            <Card variant="alara_light_bordered">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Tips</div>
                <div className="text-2xl font-bold text-[#77C8CC]">
                  ${totalTips.toFixed(2)}
                </div>
              </div>
            </Card>

            <Card variant="alara_light_bordered">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Parking</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${totalParking.toFixed(2)}
                </div>
              </div>
            </Card>
          </div>

          <Card variant="default">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Net Profit Margin
              </span>
              <span className="text-lg font-bold text-gray-900">
                {totalRevenue > 0
                  ? (
                      ((totalRevenue - totalPaid - totalParking) /
                        totalRevenue) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
