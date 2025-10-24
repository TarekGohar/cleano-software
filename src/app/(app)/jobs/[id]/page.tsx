import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";

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
    (session.user as any).role !== "OWNER" &&
    (session.user as any).role !== "ADMIN"
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
      <Card variant="default" className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold" style={{ color: "#005F6A" }}>
              {job.clientName}
            </h1>
            {job.location && (
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
          </div>
          <Link href={`/jobs/new?edit=${job.id}`}>
            <Button variant="primary">Edit Job</Button>
          </Link>
        </div>

        {job.description && (
          <p className="text-gray-600 italic mb-3">{job.description}</p>
        )}

        <div className="flex items-center gap-2">
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
          {job.jobType && (
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
              {job.jobType === "R"
                ? "Residential"
                : job.jobType === "C"
                ? "Commercial"
                : job.jobType === "PC"
                ? "Post-Construction"
                : job.jobType === "F"
                ? "Follow-up"
                : job.jobType}
            </Badge>
          )}
        </div>
      </Card>

      {/* Payment Status Alerts */}
      {job.status === "COMPLETED" && !job.paymentReceived && (
        <Card variant="warning" className="mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mr-3 mt-0.5" />
            <p className="text-sm text-yellow-700">
              Payment pending for this completed job
            </p>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {job.price !== null && (
          <Card variant="default">
            <div className="text-sm font-medium text-gray-500 mb-1">Price</div>
            <div className="text-2xl font-bold" style={{ color: "#005F6A" }}>
              ${job.price.toFixed(2)}
            </div>
          </Card>
        )}

        {job.employeePay !== null && (
          <Card variant="default">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Employee Pay
            </div>
            <div className="text-2xl font-bold text-red-600">
              -${job.employeePay.toFixed(2)}
            </div>
          </Card>
        )}

        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Payment Status
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              {job.paymentReceived ? (
                <span className="text-green-600 flex items-center text-sm font-medium">
                  ✓ Paid
                </span>
              ) : (
                <span className="text-gray-400 flex items-center text-sm font-medium">
                  ✗ Unpaid
                </span>
              )}
            </div>
            <div className="flex items-center">
              {job.invoiceSent ? (
                <span className="text-blue-600 flex items-center text-sm font-medium">
                  📄 Invoiced
                </span>
              ) : (
                <span className="text-gray-400 flex items-center text-sm font-medium">
                  📄 Not Invoiced
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Job Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Date & Time */}
        <Card variant="default">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            <Calendar className="w-5 h-5 inline mr-2" />
            Date & Time
          </h2>
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
                <dt className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration
                </dt>
                <dd className="text-sm font-medium">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Team */}
        <Card variant="default">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            <Users className="w-5 h-5 inline mr-2" />
            Team
          </h2>
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
        </Card>
      </div>

      {/* Financial Breakdown */}
      {(job.price !== null ||
        job.employeePay !== null ||
        job.totalTip !== null ||
        job.parking !== null) && (
        <Card variant="default" className="mb-6">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            <DollarSign className="w-5 h-5 inline mr-2" />
            Financial Breakdown
          </h2>
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
        </Card>
      )}

      {/* Notes */}
      {job.notes && (
        <Card variant="default" className="mb-6">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "#005F6A" }}>
            Notes
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.notes}</p>
        </Card>
      )}

      {/* Product Usage */}
      {job.productUsage.length > 0 && (
        <Card variant="default">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "#005F6A" }}>
              Product Usage
            </h2>
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
        </Card>
      )}
    </div>
  );
}
