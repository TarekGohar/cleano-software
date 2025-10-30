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
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Pencil,
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
  const totalProductCost = job.productUsage.reduce((sum, usage) => {
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

  // Calculate net profit
  const netProfit =
    (job.price || 0) -
    (job.employeePay || 0) -
    (job.parking || 0) -
    totalProductCost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="flex items-start gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {job.clientName}
            </h1>
            {job.location && (
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.description && (
              <p className="text-gray-600 mt-2">{job.description}</p>
            )}
          </div>
          <Link href={`/jobs/new?edit=${job.id}`}>
            <Button variant="primary">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Job
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge
            variant={
              job.status === "COMPLETED"
                ? "success"
                : job.status === "IN_PROGRESS"
                ? "secondary"
                : "error"
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

      {/* Payment Status Alert */}
      {job.status === "COMPLETED" && !job.paymentReceived && (
        <Card variant="warning">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700 font-medium">
              Payment pending for this completed job
            </p>
          </div>
        </Card>
      )}

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="default">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-500">Price</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {job.price !== null ? `$${job.price.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card variant="default">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-sm font-medium text-gray-500">
              Employee Pay
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {job.employeePay !== null ? `-$${job.employeePay.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card variant="default">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-500">
              Product Cost
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {totalProductCost > 0 ? `-$${totalProductCost.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card
          variant="default"
          className={
            netProfit > 0 ? "bg-green-50 border-green-200" : "bg-gray-50"
          }>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                netProfit > 0 ? "bg-green-100" : "bg-gray-100"
              }`}>
              <DollarSign
                className={`w-5 h-5 ${
                  netProfit > 0 ? "text-green-600" : "text-gray-600"
                }`}
              />
            </div>
            <div className="text-sm font-medium text-gray-500">Net Profit</div>
          </div>
          <div
            className={`text-2xl font-bold ${
              netProfit > 0 ? "text-green-600" : "text-gray-600"
            }`}>
            ${netProfit.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Date & Time */}
        <Card variant="default">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Date & Time
            </h2>
          </div>
          <dl className="space-y-3">
            {job.jobDate && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Job Date</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(job.jobDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </dd>
              </div>
            )}
            {job.startTime && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Start Time</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(job.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </dd>
              </div>
            )}
            {job.endTime && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">End Time</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(job.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </dd>
              </div>
            )}
            {duration !== null && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </dt>
                <dd className="text-sm font-semibold text-[#005F6A]">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Team */}
        <Card variant="default">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-gray-500">Assigned To</dt>
              <dd className="text-sm font-medium text-gray-900">
                {job.employee.name}
              </dd>
            </div>
            {job.cleaners.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <dt className="text-sm text-gray-500 mb-2">Cleaners</dt>
                <dd className="flex flex-wrap gap-2">
                  {job.cleaners.map((cleaner) => (
                    <span
                      key={cleaner.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-[#005F6A] to-[#77C8CC] text-white">
                      {cleaner.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Payment Status */}
        <Card variant="default">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Status
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                Payment Received
              </span>
              {job.paymentReceived ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Paid</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Unpaid</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                Invoice Sent
              </span>
              {job.invoiceSent ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-semibold">Sent</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-semibold">Not Sent</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Financial Breakdown */}
        <Card variant="default">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Financials</h2>
          </div>
          <dl className="space-y-2">
            {job.price !== null && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Price</dt>
                <dd className="text-sm font-semibold text-green-600">
                  +${job.price.toFixed(2)}
                </dd>
              </div>
            )}
            {job.employeePay !== null && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Employee Pay</dt>
                <dd className="text-sm font-semibold text-red-600">
                  -${job.employeePay.toFixed(2)}
                </dd>
              </div>
            )}
            {job.totalTip !== null && job.totalTip > 0 && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Tips</dt>
                <dd className="text-sm font-semibold text-green-600">
                  +${job.totalTip.toFixed(2)}
                </dd>
              </div>
            )}
            {job.parking !== null && job.parking > 0 && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Parking</dt>
                <dd className="text-sm font-semibold text-red-600">
                  -${job.parking.toFixed(2)}
                </dd>
              </div>
            )}
            {totalProductCost > 0 && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-500">Product Cost</dt>
                <dd className="text-sm font-semibold text-red-600">
                  -${totalProductCost.toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Notes */}
      {job.notes && (
        <Card variant="default">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {job.notes}
          </p>
        </Card>
      )}

      {/* Product Usage */}
      {job.productUsage.length > 0 && (
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Usage
              </h2>
            </div>
            <Badge variant="default" size="sm">
              Total: ${totalProductCost.toFixed(2)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost/Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {job.productUsage.map((usage) => (
                  <tr key={usage.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {usage.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {usage.quantity} {usage.product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${usage.product.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      $
                      {(usage.quantity * usage.product.costPerUnit).toFixed(2)}
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
