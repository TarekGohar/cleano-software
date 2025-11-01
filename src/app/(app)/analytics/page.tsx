import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("");
  }

  // Get all data for analytics
  const products = await db.product.findMany();
  const jobs = await db.job.findMany({
    include: {
      productUsage: {
        include: {
          product: true,
        },
      },
      employee: true,
    },
  });
  const employees = await db.user.findMany({
    where: {
      role: "EMPLOYEE",
    },
  });

  // Calculate total inventory value
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockLevel * p.costPerUnit,
    0
  );

  // Calculate low stock items
  const lowStockItems = products.filter((p) => p.stockLevel <= p.minStock);

  // Calculate total product usage cost
  const totalUsageCost = jobs.reduce((sum, job) => {
    return (
      sum +
      job.productUsage.reduce((jobSum, usage) => {
        return jobSum + usage.quantity * usage.product.costPerUnit;
      }, 0)
    );
  }, 0);

  // Calculate product usage statistics
  const productUsageStats = products.map((product) => {
    const usages = jobs.flatMap((job) =>
      job.productUsage.filter((usage) => usage.productId === product.id)
    );
    const totalUsed = usages.reduce((sum, usage) => sum + usage.quantity, 0);
    const usageCount = usages.length;
    const totalCost = totalUsed * product.costPerUnit;

    return {
      product,
      totalUsed,
      usageCount,
      totalCost,
    };
  });

  // Sort by most used
  productUsageStats.sort((a, b) => b.totalUsed - a.totalUsed);

  // Employee performance
  const employeeStats = employees.map((employee) => {
    const employeeJobs = jobs.filter((j) => j.employeeId === employee.id);
    const completedJobs = employeeJobs.filter((j) => j.status === "COMPLETED");
    const totalUsageCost = employeeJobs.reduce((sum, job) => {
      return (
        sum +
        job.productUsage.reduce((jobSum, usage) => {
          return jobSum + usage.quantity * usage.product.costPerUnit;
        }, 0)
      );
    }, 0);

    return {
      employee,
      totalJobs: employeeJobs.length,
      completedJobs: completedJobs.length,
      totalUsageCost,
    };
  });

  // Sort by total jobs
  employeeStats.sort((a, b) => b.totalJobs - a.totalJobs);

  // Recent activity
  const recentJobs = jobs
    .sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-[450] mb-6">Analytics & Reports</h1>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-[450] text-gray-500 mb-1">
            Total Inventory Value
          </div>
          <div className="text-2xl font-[450]">
            ${totalInventoryValue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-[450] text-gray-500 mb-1">
            Low Stock Items
          </div>
          <div className="text-2xl font-[450] text-red-600">
            {lowStockItems.length}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-[450] text-gray-500 mb-1">
            Total Jobs
          </div>
          <div className="text-2xl font-[450]">{jobs.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-[450] text-gray-500 mb-1">
            Total Usage Cost
          </div>
          <div className="text-2xl font-[450]">
            ${totalUsageCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-[450] text-red-900 mb-4">
            ⚠️ Low Stock Alerts
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lowStockItems.map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-4">
                <div className="font-[450] text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Current: {product.stockLevel} {product.unit}
                </div>
                <div className="text-sm text-red-600">
                  Minimum: {product.minStock} {product.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Usage Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-[450] mb-4">Product Usage Statistics</h2>
        {productUsageStats.length === 0 ? (
          <p className="text-gray-500">No usage data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Total Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Times Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Current Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productUsageStats.slice(0, 10).map((stat) => (
                  <tr key={stat.product.id}>
                    <td className="px-4 py-3 text-sm font-[450] text-gray-900">
                      {stat.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stat.totalUsed.toFixed(2)} {stat.product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stat.usageCount}
                    </td>
                    <td className="px-4 py-3 text-sm font-[450] text-gray-900">
                      ${stat.totalCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stat.product.stockLevel} {stat.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-[450] mb-4">Employee Performance</h2>
        {employeeStats.length === 0 ? (
          <p className="text-gray-500">No employee data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Total Jobs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Completed Jobs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Total Usage Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-gray-500 uppercase">
                    Avg Cost/Job
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeeStats.map((stat) => (
                  <tr key={stat.employee.id}>
                    <td className="px-4 py-3 text-sm font-[450] text-gray-900">
                      {stat.employee.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stat.totalJobs}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {stat.completedJobs}
                    </td>
                    <td className="px-4 py-3 text-sm font-[450] text-gray-900">
                      ${stat.totalUsageCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      $
                      {stat.totalJobs > 0
                        ? (stat.totalUsageCost / stat.totalJobs).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-[450] mb-4">Recent Job Activity</h2>
        {recentJobs.length === 0 ? (
          <p className="text-gray-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-[450] text-gray-900">
                    {job.clientName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.employee.name} •{" "}
                    {new Date(job.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {job.productUsage.length} product(s) used
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-[450] rounded-full ${
                      job.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : job.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
