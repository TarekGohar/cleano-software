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
      cleaners: true,
      productUsage: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!job) {
    redirect("/jobs");
  }

  // Check if user has access to view this job
  if (
    job.employeeId !== session.user.id &&
    session.user.role !== "OWNER" &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/jobs");
  }

  // Calculate total cost of products used
  const totalCost = job.productUsage.reduce((sum, usage) => {
    return sum + usage.quantity * usage.product.costPerUnit;
  }, 0);

  const duration =
    job.endTime && job.startTime
      ? Math.round(
          (new Date(job.endTime).getTime() -
            new Date(job.startTime).getTime()) /
            1000 /
            60
        )
      : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Jobs
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{job.clientName}</h1>
            </div>
            {job.location && (
              <p className="text-gray-600 mt-1">{job.location}</p>
            )}
            {job.description && (
              <p className="text-gray-600 mt-1 italic">{job.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  job.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : job.status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                {job.status.replace("_", " ")}
              </span>
              {job.jobType && (
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                    job.jobType === "R"
                      ? "bg-blue-100 text-blue-800"
                      : job.jobType === "C"
                      ? "bg-purple-100 text-purple-800"
                      : job.jobType === "PC"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  {job.jobType === "R"
                    ? "Residential"
                    : job.jobType === "C"
                    ? "Commercial"
                    : job.jobType === "PC"
                    ? "Post-Construction"
                    : job.jobType === "F"
                    ? "Follow-up"
                    : job.jobType}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/jobs/new?edit=${job.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Job
          </Link>
        </div>
      </div>

      {/* Payment Status Alerts */}
      {job.status === "COMPLETED" && !job.paymentReceived && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Payment pending for this completed job
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {job.price !== null && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Price</div>
            <div className="text-2xl font-bold text-blue-600">
              ${job.price.toFixed(2)}
            </div>
          </div>
        )}

        {job.employeePay !== null && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Employee Pay
            </div>
            <div className="text-2xl font-bold text-red-600">
              -${job.employeePay.toFixed(2)}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Payment Status
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              {job.paymentReceived ? (
                <span className="text-green-600 flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Paid
                </span>
              ) : (
                <span className="text-gray-400 flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unpaid
                </span>
              )}
            </div>
            <div className="flex items-center">
              {job.invoiceSent ? (
                <span className="text-blue-600 flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  Invoiced
                </span>
              ) : (
                <span className="text-gray-400 flex items-center">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  Not Invoiced
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Date & Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Date & Time</h2>
          <dl className="space-y-2">
            {job.jobDate && (
              <div>
                <dt className="text-sm text-gray-500">Job Date</dt>
                <dd className="text-sm font-medium">
                  {new Date(job.jobDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {job.startTime && (
              <div>
                <dt className="text-sm text-gray-500">Start Time</dt>
                <dd className="text-sm font-medium">
                  {new Date(job.startTime).toLocaleString()}
                </dd>
              </div>
            )}
            {job.endTime && (
              <div>
                <dt className="text-sm text-gray-500">End Time</dt>
                <dd className="text-sm font-medium">
                  {new Date(job.endTime).toLocaleString()}
                </dd>
              </div>
            )}
            {duration !== null && (
              <div>
                <dt className="text-sm text-gray-500">Duration</dt>
                <dd className="text-sm font-medium">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Team */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Team</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Assigned To</dt>
              <dd className="text-sm font-medium">{job.employee.name}</dd>
            </div>
            {job.cleaners.length > 0 && (
              <div>
                <dt className="text-sm text-gray-500">Cleaners</dt>
                <dd className="text-sm font-medium">
                  {job.cleaners.map((cleaner) => cleaner.name).join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Financial Breakdown */}
      {(job.price !== null ||
        job.employeePay !== null ||
        job.totalTip !== null ||
        job.parking !== null) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Financial Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {job.price !== null && (
              <div>
                <div className="text-sm text-gray-500">Price</div>
                <div className="text-lg font-semibold">
                  ${job.price.toFixed(2)}
                </div>
              </div>
            )}

            {job.employeePay !== null && (
              <div>
                <div className="text-sm text-gray-500">Employee Pay</div>
                <div className="text-lg font-semibold text-red-600">
                  -${job.employeePay.toFixed(2)}
                </div>
              </div>
            )}

            {job.totalTip !== null && job.totalTip > 0 && (
              <div>
                <div className="text-sm text-gray-500">Tips</div>
                <div className="text-lg font-semibold text-green-600">
                  +${job.totalTip.toFixed(2)}
                </div>
              </div>
            )}

            {job.parking !== null && job.parking > 0 && (
              <div>
                <div className="text-sm text-gray-500">Parking</div>
                <div className="text-lg font-semibold text-red-600">
                  -${job.parking.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.notes}</p>
        </div>
      )}

      {/* Product Usage */}
      {job.productUsage.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Product Usage</h2>
            <div className="text-lg font-semibold text-gray-900">
              Total Cost: ${totalCost.toFixed(2)}
            </div>
          </div>

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
        </div>
      )}
    </div>
  );
}
