import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";

export default async function JobPage({
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

  const job = await db.job.findUnique({
    where: { id },
    include: {
      employee: true,
      productUsage: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!job) {
    redirect("/dashboard/jobs");
  }

  // Check if user has access to view this job
  if (
    job.employeeId !== session.user.id &&
    session.user.role !== "OWNER" &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/dashboard/jobs");
  }

  // Calculate total cost of products used
  const totalCost = job.productUsage.reduce((sum, usage) => {
    return sum + usage.quantity * usage.product.costPerUnit;
  }, 0);

  const duration = job.endTime
    ? Math.round(
        (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) /
          1000 /
          60
      )
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/jobs"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Jobs
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{job.clientName}</h1>
            {job.location && (
              <p className="text-gray-600 mt-1">{job.location}</p>
            )}
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-2 ${
                job.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : job.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
              {job.status}
            </span>
          </div>
          {job.status === "IN_PROGRESS" &&
            job.employeeId === session.user.id && (
              <Link
                href={`/dashboard/jobs/${job.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Edit Job
              </Link>
            )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Employee</div>
          <div className="text-lg font-semibold">{job.employee.name}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Start Time
          </div>
          <div className="text-lg font-semibold">
            {new Date(job.startTime).toLocaleString()}
          </div>
        </div>

        {job.endTime && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">
                End Time
              </div>
              <div className="text-lg font-semibold">
                {new Date(job.endTime).toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Duration
              </div>
              <div className="text-lg font-semibold">
                {duration
                  ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                  : "-"}
              </div>
            </div>
          </>
        )}
      </div>

      {job.description && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700">{job.description}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Product Usage</h2>
          <div className="text-lg font-semibold text-gray-900">
            Total Cost: ${totalCost.toFixed(2)}
          </div>
        </div>

        {job.productUsage.length === 0 ? (
          <p className="text-gray-500">No products used for this job.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cost/Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {job.productUsage.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {usage.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {usage.quantity} {usage.product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ${usage.product.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${(usage.quantity * usage.product.costPerUnit).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {usage.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
