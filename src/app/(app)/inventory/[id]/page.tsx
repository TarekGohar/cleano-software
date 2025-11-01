import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default async function ProductPage({
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
        take: 10,
      },
      employeeProducts: {
        include: {
          employee: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
    },
  });

  if (!product) {
    redirect("/inventory");
  }

  // Calculate total quantity assigned to employees
  const totalAssigned = (product as any).employeeProducts.reduce(
    (sum: number, ep: any) => sum + ep.quantity,
    0
  );

  // Calculate usage statistics
  const totalUsed = (product as any).jobUsage.reduce(
    (sum: number, usage: any) => sum + usage.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            href="/inventory"
            submit={false}
            className="!px-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-[450] text-gray-900">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-gray-600 mt-2">{product.description}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card variant="alara_light_bordered">
          <div className="p-3">
            <div className="text-2xl font-[450] text-cyan-700">
              {product.stockLevel} {product.unit}
            </div>
            <p className="text-sm text-gray-600 mt-1">In Warehouse</p>
            {product.stockLevel <= product.minStock && (
              <Badge variant="error" size="sm" className="mt-2">
                Low Stock!
              </Badge>
            )}
          </div>
        </Card>

        <Card variant="alara_light_bordered">
          <div className="p-3">
            <div className="text-2xl font-[450] text-[#005F6A]">
              {totalAssigned} {product.unit}
            </div>
            <p className="text-sm text-gray-600 mt-1">Assigned to Employees</p>
          </div>
        </Card>

        <Card variant="alara_light_bordered">
          <div className="p-3">
            <div className="text-2xl font-[450] text-[#77C8CC]">
              {(product.stockLevel + totalAssigned).toFixed(2)} {product.unit}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Inventory</p>
            <p className="text-xs text-gray-500 mt-1">Warehouse + Assigned</p>
          </div>
        </Card>

        <Card variant="alara_light_bordered">
          <div className="p-3">
            <div className="text-2xl font-[450] text-gray-900">
              ${product.costPerUnit.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Cost per {product.unit}
            </p>
          </div>
        </Card>

        <Card variant="alara_light_bordered">
          <div className="p-3">
            <div className="text-2xl font-[450] text-green-600">
              $
              {(
                (product.stockLevel + totalAssigned) *
                product.costPerUnit
              ).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Value</p>
          </div>
        </Card>
      </div>

      {/* Employee Assignments */}
      <Card variant="alara_light_bordered">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-[450] text-cyan-700">
              Assigned to Employees
            </h2>
            {(product as any).employeeProducts.length > 0 && (
              <Badge variant="alara" size="sm">
                {(product as any).employeeProducts.length} employee
                {(product as any).employeeProducts.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {(product as any).employeeProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">
                This product is not currently assigned to any employees.
              </p>
              <Button variant="default" size="sm" href="/employees">
                Go to Employees to assign →
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-[450] text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(product as any).employeeProducts.map(
                      (assignment: any) => (
                        <tr
                          key={assignment.id}
                          className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-[450] text-gray-900">
                              {assignment.employee.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {assignment.employee.email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {assignment.quantity} {product.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-[450] text-green-600">
                            $
                            {(
                              assignment.quantity * product.costPerUnit
                            ).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(
                              assignment.assignedAt
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {assignment.notes || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <Button
                              variant="default"
                              size="sm"
                              href={`/employees/${assignment.employee.id}`}>
                              View Employee →
                            </Button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50/50">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-sm font-[450] text-gray-700">
                        Total Assigned
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {totalAssigned} {product.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-[450] text-green-600">
                        ${(totalAssigned * product.costPerUnit).toFixed(2)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grid for Recent Usage and Stock Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Usage */}
        <Card variant="default">
          <div className="space-y-4">
            <h2 className="text-xl font-[450] text-gray-900">
              Recent Usage in Jobs
            </h2>

            {(product as any).jobUsage.length === 0 ? (
              <p className="text-gray-500 text-sm">No usage recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {(product as any).jobUsage.map((usage: any) => (
                  <div
                    key={usage.id}
                    className="flex justify-between items-start p-3 bg-[#005F6A]/5 rounded-lg hover:bg-[#005F6A]/10 transition-colors">
                    <div>
                      <div className="font-[450] text-gray-900">
                        {usage.job.clientName}
                      </div>
                      <div className="text-sm text-gray-600">
                        by {usage.job.employee.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(usage.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="alara" size="sm">
                      {usage.quantity} {product.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Stock Summary */}
        <Card variant="default">
          <div className="space-y-4">
            <h2 className="text-xl font-[450] text-gray-900">Stock Summary</h2>

            <div className="space-y-4">
              <Card variant="alara_light_bordered">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Minimum Stock Threshold
                  </div>
                  <div className="text-2xl font-[450] text-[#005F6A]">
                    {product.minStock} {product.unit}
                  </div>
                </div>
              </Card>

              <Card variant="default">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Total Used in Jobs
                  </div>
                  <div className="text-2xl font-[450] text-gray-700">
                    {totalUsed} {product.unit}
                  </div>
                </div>
              </Card>

              {product.stockLevel <= product.minStock && (
                <Card variant="error">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-[450] text-red-800">
                        Low Stock Alert
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        Stock level is at or below minimum threshold. Consider
                        reordering.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
