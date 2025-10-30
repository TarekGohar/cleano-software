import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Card from "@/components/ui/Card";
import { Prisma } from "@prisma/client";
import { JobsFilters } from "./JobsFilters";
import { JobsPagination } from "./JobsPagination";
import { TableHeader } from "./TableHeader";
import { TableLoadingOverlay } from "./TableLoadingOverlay";
import { JobsLoadingProvider } from "./JobsLoadingContext";
import { ClearLoadingOnMount } from "./ClearLoadingOnMount";
import { JobModalProvider, CreateJobButton } from "./JobsClient";
import { JobRow } from "./JobRow";
import { AlertTriangle } from "lucide-react";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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

  // Parse search params
  const params = await searchParams;
  const cursor = (params.cursor as string) || null;
  const direction = (params.direction as string) || null;
  const perPage = Number(params.perPage) || 10;
  const search = (params.search as string) || "";
  const status = (params.status as string) || "all";
  const payment = (params.payment as string) || "all";
  const sortBy = (params.sortBy as string) || "jobDate";
  const sortOrder = (params.sortOrder as string) || "desc";

  // Build where clause
  const where: Prisma.JobWhereInput = {};

  // Role-based filtering
  if (!isAdmin) {
    where.employeeId = session.user.id;
  }

  // Search filter
  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (status !== "all") {
    where.status = status as Prisma.EnumJobStatusFilter;
  }

  // Payment filter
  if (payment === "paid") {
    where.paymentReceived = true;
  } else if (payment === "pending") {
    where.paymentReceived = false;
    where.status = "COMPLETED";
  }

  // Cursor-based pagination
  const take = perPage + 1; // Fetch one extra to check if there's a next page
  const orderBy: any = { [sortBy]: sortOrder };

  let jobs;

  if (cursor && direction === "next") {
    // Next page
    jobs = await db.job.findMany({
      where,
      include: {
        employee: true,
        cleaners: true,
        productUsage: {
          include: {
            product: true,
          },
        },
      },
      orderBy,
      take,
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    });
  } else if (cursor && direction === "prev") {
    // Previous page - reverse the order
    const reverseOrder: any = {
      [sortBy]: sortOrder === "asc" ? "desc" : "asc",
    };
    jobs = await db.job.findMany({
      where,
      include: {
        employee: true,
        cleaners: true,
        productUsage: {
          include: {
            product: true,
          },
        },
      },
      orderBy: reverseOrder,
      take,
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    });
    // Reverse the results back to correct order
    jobs = jobs.reverse();
  } else {
    // First page
    jobs = await db.job.findMany({
      where,
    include: {
      employee: true,
      cleaners: true,
      productUsage: {
        include: {
          product: true,
        },
      },
    },
      orderBy,
      take,
    });
  }

  // Check if there are more pages
  const hasNextPage = jobs.length > perPage;
  if (hasNextPage) {
    jobs.pop(); // Remove the extra item
  }

  // Check if there's a previous page (we have a cursor and we're not on the first page)
  const hasPrevPage = Boolean(cursor);

  // Get cursors for pagination
  const nextCursor = hasNextPage ? jobs[jobs.length - 1]?.id : null;
  const prevCursor = jobs[0]?.id || null;

  // Calculate statistics (for all jobs, not just current page)
  const allJobsWhere = { ...where };
  delete allJobsWhere.OR; // Remove search for stats

  const totalRevenue = await db.job.aggregate({
    where: allJobsWhere,
    _sum: { price: true },
  });

  const completedJobs = await db.job.count({
    where: { ...allJobsWhere, status: "COMPLETED" },
  });

  const pendingPaymentCount = await db.job.count({
    where: { ...allJobsWhere, paymentReceived: false, status: "COMPLETED" },
  });

  const totalJobsCount = await db.job.count({
    where: allJobsWhere,
  });

  // Calculate minimum rows to display based on perPage
  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(0, minDisplayRows - jobs.length);

  // Create a unique key based on search params to detect data changes
  const dataKey = `${cursor}-${search}-${status}-${payment}-${sortBy}-${sortOrder}-${perPage}-${jobs.length}`;

  return (
    <JobsLoadingProvider>
      <JobModalProvider>
        <ClearLoadingOnMount dataKey={dataKey} />
        <div className="space-y-6">
          {/* Header */}
          <Card variant="ghost">
        <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
            Cleaning Jobs
          </h1>
              <CreateJobButton />
        </div>
      </Card>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Jobs
          </div>
          <div className="text-2xl font-bold" style={{ color: "#005F6A" }}>
                {totalJobsCount}
          </div>
        </Card>
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Completed
          </div>
          <div className="text-2xl font-bold text-green-600">
                {completedJobs}
          </div>
        </Card>
        <Card variant="default">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Revenue
          </div>
          <div className="text-2xl font-bold" style={{ color: "#77C8CC" }}>
                ${(totalRevenue._sum.price || 0).toFixed(2)}
          </div>
        </Card>
      </div>

          {/* Pending Payment Warning */}
          {pendingPaymentCount > 0 && (
            <Card variant="warning">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mr-3 mt-0.5" />
            <p className="text-sm text-yellow-700">
                  {pendingPaymentCount} completed job
                  {pendingPaymentCount !== 1 ? "s" : ""} pending payment
            </p>
          </div>
        </Card>
      )}

          {/* Search and Filters */}
          <JobsFilters />

          {/* Jobs Table */}
        <Card variant="default">
            <div className="overflow-hidden rounded-lg relative">
              <TableLoadingOverlay />
          <div className="overflow-x-auto">
                {/* Header row */}
                <div className="grid bg-gray-50/50" style={{ gridTemplateColumns: "120px 1fr 80px 1.5fr 100px 120px 120px 210px" }}>
                  <TableHeader label="Date" sortKey="jobDate" />
                  <TableHeader label="Client" sortKey="clientName" />
                  <span className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-center">
                    Type
                  </span>
                  <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                    Cleaners
                  </span>
                  <TableHeader label="Price" sortKey="price" />
                  <TableHeader label="Status" sortKey="status" />
                  <span className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-center">
                    Payment
                  </span>
                  <span className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end">
                    Actions
                  </span>
                </div>
                {/* Jobs - Fixed height */}
                <div className="bg-white divide-y divide-gray-50 relative">
                  {jobs.length === 0 ? (
                    <>
                      <div className="px-6 py-8 text-center text-sm text-gray-500">
                        {search || status !== "all" || payment !== "all"
                          ? "No jobs found matching your filters."
                          : "No jobs found."}
                      </div>
                      {/* Placeholder rows */}
                      {Array.from({ length: minDisplayRows - 1 }).map(
                        (_, idx) => (
                          <div
                            key={`placeholder-${idx}`}
                            className="grid h-16"
                            style={{ gridTemplateColumns: "120px 1fr 80px 1.5fr 100px 120px 120px 210px" }}>
                            {Array.from({ length: 8 }).map((_, colIdx) => (
                              <div key={colIdx} className="px-6 py-4"></div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      {jobs.map((job) => (
                        <JobRow key={job.id} job={job} />
                      ))}
                      {/* Placeholder rows to fill up to minimum display rows */}
                      {placeholderRowCount > 0 &&
                        Array.from({ length: placeholderRowCount }).map(
                          (_, idx) => (
                            <div
                              key={`placeholder-${idx}`}
                              className="grid h-16"
                              style={{ gridTemplateColumns: "120px 1fr 80px 1.5fr 100px 120px 120px 210px" }}>
                              {Array.from({ length: 8 }).map((_, colIdx) => (
                                <div key={colIdx} className="px-6 py-4"></div>
                              ))}
                            </div>
                          )
                        )}
                    </>
                          )}
                        </div>
                      </div>
          </div>
        </Card>

          {/* Pagination */}
          <JobsPagination
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            nextCursor={nextCursor}
            prevCursor={prevCursor}
            currentCount={jobs.length}
            perPage={perPage}
            minDisplayRows={minDisplayRows}
          />
    </div>
      </JobModalProvider>
    </JobsLoadingProvider>
  );
}
