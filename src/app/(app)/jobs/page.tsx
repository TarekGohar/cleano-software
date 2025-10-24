import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

export default async function JobsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check user role - admins/owners can see all jobs
  const isAdmin =
    (session.user as any).role === "ADMIN" ||
    (session.user as any).role === "OWNER";

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
      <Card variant="default" className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: "#005F6A" }}>
            Cleaning Jobs
          </h1>
          <Link href="/jobs/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Jobs
          </div>
          <div className="text-2xl font-bold" style={{ color: "#005F6A" }}>
            {jobs.length}
          </div>
        </Card>
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Completed
          </div>
          <div className="text-2xl font-bold text-green-600">
            {completedJobs.length}
          </div>
        </Card>
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Revenue
          </div>
          <div className="text-2xl font-bold" style={{ color: "#77C8CC" }}>
            ${totalRevenue.toFixed(2)}
          </div>
        </Card>
      </div>

      {pendingPayment.length > 0 && (
        <Card variant="warning" className="mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mr-3 mt-0.5" />
            <p className="text-sm text-yellow-700">
              {pendingPayment.length} completed job
              {pendingPayment.length !== 1 ? "s" : ""} pending payment
            </p>
          </div>
        </Card>
      )}

      {jobs.length === 0 ? (
        <Card variant="default" className="p-12 text-center">
          <p className="text-gray-500 mb-4">
            No jobs created yet. Start by creating your first cleaning job.
          </p>
          <Link href="/jobs/new">
            <Button variant="primary">Create Your First Job</Button>
          </Link>
        </Card>
      ) : (
        <Card variant="default">
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
                      <Badge
                        variant={
                          job.jobType === "R"
                            ? "secondary"
                            : job.jobType === "C"
                            ? "default"
                            : job.jobType === "PC"
                            ? "warning"
                            : "default"
                        }>
                        {job.jobType || "-"}
                      </Badge>
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
                      <Badge
                        variant={
                          job.status === "COMPLETED"
                            ? "success"
                            : job.status === "IN_PROGRESS"
                            ? "secondary"
                            : "default"
                        }>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div title="Payment Received">
                          {job.paymentReceived ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div title="Invoice Sent">
                          {job.invoiceSent ? (
                            <FileText className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/jobs/new?edit=${job.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
