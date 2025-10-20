import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";

export default async function JobsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check user role - admins/owners can see all jobs
  const isAdmin =
    session.user.role === "ADMIN" || session.user.role === "OWNER";

  const jobs = await db.job.findMany({
    where: isAdmin
      ? {}
      : {
          employeeId: session.user.id,
        },
    include: {
      employee: true,
      cleaners: true,
      productUsage: {
        include: {
          product: true,
        },
      },
    },
    orderBy: [{ jobDate: "desc" }, { startTime: "desc" }],
  });

  // Calculate statistics
  const totalRevenue = jobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
  const pendingPayment = jobs.filter(
    (j) => !j.paymentReceived && j.status === "COMPLETED"
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cleaning Jobs</h1>
        <Link
          href="/jobs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create New Job
        </Link>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Jobs
          </div>
          <div className="text-2xl font-bold">{jobs.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Completed
          </div>
          <div className="text-2xl font-bold text-green-600">
            {completedJobs.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Revenue
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
      </div>

      {pendingPayment.length > 0 && (
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
                {pendingPayment.length} completed job
                {pendingPayment.length !== 1 ? "s" : ""} pending payment
              </p>
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            No jobs created yet. Start by creating your first cleaning job.
          </p>
          <Link
            href="/jobs/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Your First Job
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaners
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {job.jobDate
                        ? new Date(job.jobDate).toLocaleDateString()
                        : new Date(job.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {job.clientName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          job.jobType === "R"
                            ? "bg-blue-100 text-blue-800"
                            : job.jobType === "C"
                            ? "bg-purple-100 text-purple-800"
                            : job.jobType === "PC"
                            ? "bg-orange-100 text-orange-800"
                            : job.jobType === "F"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                        {job.jobType || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div
                        className="max-w-xs truncate"
                        title={
                          job.cleaners.map((c) => c.name).join(", ") || "-"
                        }>
                        {job.cleaners.length > 0
                          ? job.cleaners.map((c) => c.name).join(", ")
                          : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.price ? `$${job.price.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          job.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : job.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {job.paymentReceived ? (
                          <span
                            className="text-green-600"
                            title="Payment Received">
                            ✓
                          </span>
                        ) : (
                          <span
                            className="text-gray-300"
                            title="Payment Pending">
                            ✓
                          </span>
                        )}
                        {job.invoiceSent ? (
                          <span className="text-blue-600" title="Invoice Sent">
                            📄
                          </span>
                        ) : (
                          <span
                            className="text-gray-300"
                            title="Invoice Not Sent">
                            📄
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </Link>
                      <Link
                        href={`/jobs/new?edit=${job.id}`}
                        className="text-gray-600 hover:text-gray-900">
                        Edit
                      </Link>
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
