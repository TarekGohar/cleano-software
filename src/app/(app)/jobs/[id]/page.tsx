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
  History,
  Activity,
} from "lucide-react";
import PaymentStatusButtons from "./PaymentStatusButtons";
import ActivityLogPagination from "./ActivityLogPagination";

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const logsPage = Number(search.logsPage) || 1;
  const logsPerPage = 10;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const job = (await db.job.findUnique({
    where: { id },
    include: {
      employee: true,
      cleaners: true,
      productUsage: {
        include: {
          product: true,
        },
      },
      _count: {
        select: { logs: true },
      },
    },
  })) as any;

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

  // Fetch paginated logs separately
  const totalLogs = (job as any)._count.logs;
  const logs = await (db as any).jobLog.findMany({
    where: { jobId: id },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (logsPage - 1) * logsPerPage,
    take: logsPerPage,
  });

  // Calculate total cost of products used
  const totalProductCost = job.productUsage.reduce(
    (sum: number, usage: any) => {
      return sum + usage.quantity * usage.product.costPerUnit;
    },
    0
  );

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

  // Check if user is admin
  const isAdmin =
    (session.user as any).role === "OWNER" ||
    (session.user as any).role === "ADMIN";

  return (
    <div className="space-y-4">
      {/* Header */}

      <Link href="/jobs">
        <Button variant="alara" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
      </Link>
      <Card variant="ghost" className="py-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-[450] text-[#005F6A]">
              {job.clientName}
            </h1>
            {job.location && (
              <div className="flex items-center gap-2 text-[#005F6A]/70 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.description && (
              <p className="text-[#005F6A]/60 mt-2">{job.description}</p>
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
                ? "alara"
                : job.status === "IN_PROGRESS"
                ? "secondary"
                : "default"
            }>
            {job.status.replace("_", " ")}
          </Badge>
          {job.jobType && (
            <Badge variant="alara">
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
        <Card variant="alara_light_bordered_high">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#005F6A] flex-shrink-0" />
            <p className="text-sm text-[#005F6A] font-[450]">
              Payment pending for this completed job
            </p>
          </div>
        </Card>
      )}

      {/* Financial Overview */}
      <h2 className="text-lg font-[450] text-[#005F6A]">Financial Overview</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="alara_light_bordered" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#005F6A]" />
            </div>
            <div className="text-sm font-[450] text-[#005F6A]/70">Price</div>
          </div>
          <div className="text-2xl font-[450] text-[#005F6A]">
            {job.price !== null ? `$${job.price.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card variant="alara_light_bordered" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#005F6A]" />
            </div>
            <div className="text-sm font-[450] text-[#005F6A]/70">
              Employee Pay
            </div>
          </div>
          <div className="text-2xl font-[450] text-[#005F6A]">
            {job.employeePay !== null ? `-$${job.employeePay.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card variant="alara_light_bordered" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <Package className="w-5 h-5 text-[#005F6A]" />
            </div>
            <div className="text-sm font-[450] text-[#005F6A]/70">
              Product Cost
            </div>
          </div>
          <div className="text-2xl font-[450] text-[#005F6A]">
            {totalProductCost > 0 ? `-$${totalProductCost.toFixed(2)}` : "-"}
          </div>
        </Card>

        <Card variant="alara_light_bordered" className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#005F6A]" />
            </div>
            <div className="text-sm font-[450] text-[#005F6A]/70">
              Net Profit
            </div>
          </div>
          <div className="text-2xl font-[450] text-[#005F6A]">
            ${netProfit.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <h2 className="text-lg font-[450] text-[#005F6A] mt-12">
        Cleaning Details
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Date & Time */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <Calendar className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">Date & Time</h2>
          </div>
          <dl className="space-y-3">
            {job.jobDate && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-[#005F6A]/60">Job Date</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
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
                <dt className="text-sm text-[#005F6A]/60">Start Time</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
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
                <dt className="text-sm text-[#005F6A]/60">End Time</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  {new Date(job.endTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </dd>
              </div>
            )}
            {duration !== null && (
              <div className="flex justify-between items-center pt-2 border-t border-[#005F6A]/10">
                <dt className="text-sm text-[#005F6A]/60 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  {Math.floor(duration / 60)}h {duration % 60}m
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Team */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <Users className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">Team</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-sm text-[#005F6A]/60">Created By</dt>
              <Badge variant="alara">{job.employee.name}</Badge>
            </div>
            {job.cleaners.length > 0 && (
              <div className="flex justify-between items-center">
                <dt className="text-sm text-[#005F6A]/60">Assigned Cleaners</dt>
                <dd className="flex flex-wrap gap-2">
                  {job.cleaners.map((cleaner: any) => (
                    <Badge key={cleaner.id} variant="alara">
                      {cleaner.name}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {job.notes && (
        <div>
          <h2 className="text-lg font-[450] text-[#005F6A] mt-12">Notes</h2>
          <Card variant="alara_light_bordered">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                <FileText className="w-5 h-5 text-[#005F6A]" />
              </div>
              <h2 className="text-lg font-[450] text-[#005F6A]">Notes</h2>
            </div>
            <p className="text-[#005F6A]/70 whitespace-pre-wrap leading-relaxed">
              {job.notes}
            </p>
          </Card>
        </div>
      )}

      <h2 className="text-lg font-[450] text-[#005F6A] mt-12">Financials</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Status */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">
              Payment Status
            </h2>
          </div>
          <PaymentStatusButtons
            jobId={job.id}
            paymentReceived={job.paymentReceived}
            invoiceSent={job.invoiceSent}
            isAdmin={isAdmin}
          />
        </Card>

        {/* Enhanced Financial Breakdown */}
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">
              Financial Details
            </h2>
          </div>
          <dl className="space-y-2">
            {job.price !== null && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#77C8CC]/10">
                <dt className="text-sm text-[#005F6A]/70">Job Price</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  +${job.price.toFixed(2)}
                </dd>
              </div>
            )}
            {job.employeePay !== null && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#005F6A]/5">
                <dt className="text-sm text-[#005F6A]/70">Employee Pay</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  -${job.employeePay.toFixed(2)}
                </dd>
              </div>
            )}
            {job.totalTip !== null && job.totalTip > 0 && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#77C8CC]/10">
                <dt className="text-sm text-[#005F6A]/70">Tips</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  +${job.totalTip.toFixed(2)}
                </dd>
              </div>
            )}
            {job.parking !== null && job.parking > 0 && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#005F6A]/5">
                <dt className="text-sm text-[#005F6A]/70">Parking Cost</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  -${job.parking.toFixed(2)}
                </dd>
              </div>
            )}
            {totalProductCost > 0 && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#005F6A]/5">
                <dt className="text-sm text-[#005F6A]/70">Product Cost</dt>
                <dd className="text-sm font-[450] text-[#005F6A]">
                  -${totalProductCost.toFixed(2)}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-center p-2 rounded-lg bg-[#005F6A]/10 border border-[#005F6A]/20 mt-2">
              <dt className="text-sm font-[450] text-[#005F6A]">Net Profit</dt>
              <dd className="text-base font-[450] text-[#005F6A]">
                ${netProfit.toFixed(2)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Product Usage */}
      <h2 className="text-lg font-[450] text-[#005F6A] mt-12">Usage</h2>
      {job.productUsage.length > 0 ? (
        <Card variant="default" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
                <Package className="w-5 h-5 text-[#005F6A]" />
              </div>
              <h2 className="text-lg font-[450] text-[#005F6A]">
                Product Usage
              </h2>
            </div>
            <Badge variant="alara" size="sm">
              Total: ${totalProductCost.toFixed(2)}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#005F6A]/10">
              <thead className="bg-[#77C8CC]/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider">
                    Cost/Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-[450] text-[#005F6A]/70 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#005F6A]/10">
                {job.productUsage.map((usage: any) => (
                  <tr key={usage.id} className="hover:bg-[#77C8CC]/5">
                    <td className="px-4 py-3 text-sm font-[450] text-[#005F6A]">
                      {usage.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#005F6A]">
                      {usage.quantity} {usage.product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#005F6A]/70">
                      ${usage.product.costPerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-[450] text-[#005F6A]">
                      ${(usage.quantity * usage.product.costPerUnit).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#005F6A]/70">
                      {usage.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <Package className="w-5 h-5 text-[#005F6A]" />
            </div>
          </div>
          <p className="text-[#005F6A]/70">
            No product usage recorded for this job
          </p>
        </Card>
      )}

      {/* Activity Log */}
      <h2 id="logs" className="text-lg font-[450] text-[#005F6A] mt-12">
        Logs
      </h2>
      {logs && logs.length > 0 ? (
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <History className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">Activity Log</h2>
          </div>

          <div className="space-y-3">
            {logs.map((log: any, index: number) => {
              const isLast = index === logs.length - 1;

              // Icon based on action type
              const getActionIcon = () => {
                switch (log.action) {
                  case "CLOCKED_IN":
                  case "CLOCKED_OUT":
                    return <Clock className="w-4 h-4" />;
                  case "STATUS_CHANGED":
                    return <Activity className="w-4 h-4" />;
                  case "PRODUCT_USED":
                    return <Package className="w-4 h-4" />;
                  case "PAYMENT_RECEIVED":
                  case "INVOICE_SENT":
                    return <DollarSign className="w-4 h-4" />;
                  case "CLEANER_ADDED":
                  case "CLEANER_REMOVED":
                    return <Users className="w-4 h-4" />;
                  default:
                    return <FileText className="w-4 h-4" />;
                }
              };

              return (
                <div key={log.id} className="relative">
                  <div className="flex gap-3">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[17px] top-10 bottom-0 w-px bg-[#005F6A]/10" />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-[#77C8CC]/20 text-[#005F6A] flex-shrink-0">
                      {getActionIcon()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-[450] text-[#005F6A]">
                            {log.description}
                          </p>
                          {log.user && (
                            <p className="text-xs text-[#005F6A]/60 mt-1">
                              by {log.user.name}
                            </p>
                          )}
                          {log.field && log.oldValue && log.newValue && (
                            <p className="text-xs text-[#005F6A]/60 mt-1">
                              {log.field}: {log.oldValue} → {log.newValue}
                            </p>
                          )}
                        </div>
                        <time className="text-xs text-[#005F6A]/60 ml-4 flex-shrink-0">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalLogs > logsPerPage && (
            <ActivityLogPagination
              currentPage={logsPage}
              totalItems={totalLogs}
              itemsPerPage={logsPerPage}
              jobId={id}
            />
          )}
        </Card>
      ) : (
        <Card variant="default" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#77C8CC]/20 rounded-lg">
              <History className="w-5 h-5 text-[#005F6A]" />
            </div>
            <h2 className="text-lg font-[450] text-[#005F6A]">Activity Log</h2>
          </div>
          <p className="text-[#005F6A]/70">No activity logs yet</p>
        </Card>
      )}
    </div>
  );
}
