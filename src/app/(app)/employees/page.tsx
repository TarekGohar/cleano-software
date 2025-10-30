import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ChevronRight } from "lucide-react";
import { Prisma } from "@prisma/client";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeePagination } from "./EmployeePagination";
import { TableHeader } from "./TableHeader";
import { TableLoadingOverlay } from "./TableLoadingOverlay";
import { EmployeeLoadingProvider } from "./EmployeeLoadingContext";
import { ClearLoadingOnMount } from "./ClearLoadingOnMount";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default async function EmployeesPage({
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

  // Admin only - OWNER or ADMIN
  const userRole = (session.user as any).role;
  if (userRole !== "OWNER" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Parse search params
  const params = await searchParams;
  const cursor = (params.cursor as string) || null;
  const direction = (params.direction as string) || null;
  const perPage = Number(params.perPage) || 10;
  const search = (params.search as string) || "";
  const role = (params.role as string) || "all";
  const jobStatus = (params.jobStatus as string) || "all";
  const sortBy = (params.sortBy as string) || "name";
  const sortOrder = (params.sortOrder as string) || "asc";

  // Build where clause
  const where: Prisma.UserWhereInput = {};

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  // Role filter
  if (role !== "all") {
    where.role = role as any;
  }

  // Job status filter (we'll apply this after fetching)
  // Note: For more efficient filtering, consider aggregating at the database level

  // Cursor-based pagination
  const take = perPage + 1; // Fetch one extra to check if there's a next page
  const orderBy: any = { [sortBy]: sortOrder };

  let employees;

  if (cursor && direction === "next") {
    // Next page
    employees = await db.user.findMany({
      where,
      include: {
        jobs: {
          include: {
            productUsage: true,
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
    employees = await db.user.findMany({
      where,
      include: {
        jobs: {
          include: {
            productUsage: true,
          },
        },
      },
      orderBy: reverseOrder,
      take,
      skip: 1, // Skip the cursor
      cursor: { id: cursor },
    });
    // Reverse the results back to correct order
    employees = employees.reverse();
  } else {
    // First page
    employees = await db.user.findMany({
      where,
      include: {
        jobs: {
          include: {
            productUsage: true,
          },
        },
      },
      orderBy,
      take,
    });
  }

  // Check if there are more pages
  const hasNextPage = employees.length > perPage;
  if (hasNextPage) {
    employees.pop(); // Remove the extra item
  }

  // Check if there's a previous page (we have a cursor and we're not on the first page)
  const hasPrevPage = Boolean(cursor);

  // Get cursors for pagination
  const nextCursor = hasNextPage ? employees[employees.length - 1]?.id : null;
  const prevCursor = employees[0]?.id || null;

  // Calculate summary stats for each employee
  let employeeStats = employees.map((emp) => {
    const completedJobs = emp.jobs.filter((j: any) => j.status === "COMPLETED");
    const activeJobs = emp.jobs.filter((j: any) => j.status === "IN_PROGRESS");
    const totalRevenue = completedJobs.reduce(
      (sum: number, j: any) => sum + (j.price || 0),
      0
    );
    const unpaidJobs = completedJobs.filter(
      (j: any) => !j.paymentReceived
    ).length;

    return {
      ...emp,
      completedJobsCount: completedJobs.length,
      activeJobsCount: activeJobs.length,
      totalRevenue,
      unpaidJobs,
    };
  });

  // Apply job status filter (client-side for calculated fields)
  if (jobStatus === "active") {
    employeeStats = employeeStats.filter((e) => e.activeJobsCount > 0);
  } else if (jobStatus === "completed") {
    employeeStats = employeeStats.filter((e) => e.completedJobsCount > 0);
  } else if (jobStatus === "unpaid") {
    employeeStats = employeeStats.filter((e) => e.unpaidJobs > 0);
  }

  // Calculate minimum rows to display based on perPage
  // If perPage <= 10, use perPage as minimum, otherwise use 10 as minimum
  const minDisplayRows = Math.min(perPage, 10);
  const placeholderRowCount = Math.max(
    0,
    minDisplayRows - employeeStats.length
  );

  // Create a unique key based on search params to detect data changes
  const dataKey = `${cursor}-${search}-${role}-${jobStatus}-${sortBy}-${sortOrder}-${perPage}-${employeeStats.length}`;

  return (
    <EmployeeLoadingProvider>
      <ClearLoadingOnMount dataKey={dataKey} />
      <div className="space-y-6">
        {/* Header */}
        <Card variant="default">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <Button variant="primary" size="md" href="/employees/new">
              + Create Employee
            </Button>
          </div>
        </Card>

        {/* Search and Filters */}
        <EmployeeFilters />

        {/* Employees Table */}
        <Card variant="default">
          <div className="overflow-hidden rounded-lg relative">
            <TableLoadingOverlay />
            <div className="overflow-x-auto">
              {/* Header row */}
              <div className="grid grid-cols-8 bg-gray-50/50">
                <TableHeader label="Name" sortKey="name" />
                <TableHeader label="Email" sortKey="email" />
                <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  Phone
                </span>
                <TableHeader label="Role" sortKey="role" />
                <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  Completed Jobs
                </span>
                <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  Active Jobs
                </span>
                <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                  Total Revenue
                </span>
                <span className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end">
                  Actions
                </span>
              </div>
              {/* Employees - Fixed height for 10 rows */}
              <div className="bg-white divide-y divide-gray-50 relative">
                {employeeStats.length === 0 ? (
                  <>
                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                      {search || role !== "all" || jobStatus !== "all"
                        ? "No employees found matching your filters."
                        : "No employees found."}
                    </div>
                    {/* Placeholder rows */}
                    {Array.from({ length: minDisplayRows - 1 }).map(
                      (_, idx) => (
                        <div
                          key={`placeholder-${idx}`}
                          className="grid grid-cols-8 h-16">
                          {Array.from({ length: 8 }).map((_, colIdx) => (
                            <div key={colIdx} className="px-6 py-4"></div>
                          ))}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <>
                    {employeeStats.map((employee) => (
                      <div
                        key={employee.id}
                        className="grid grid-cols-8 hover:bg-gray-50/50 transition-colors items-center">
                        {/* Name + Unpaid */}
                        <div className="px-6 py-4 flex flex-col justify-center">
                          <span className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </span>
                          {employee.unpaidJobs > 0 && (
                            <span className="text-xs text-orange-600 mt-0.5">
                              {employee.unpaidJobs} unpaid job
                              {employee.unpaidJobs > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        {/* Email */}
                        <span className="px-6 py-4 text-sm text-gray-500 flex items-center">
                          {employee.email}
                        </span>
                        {/* Phone */}
                        <span className="px-6 py-4 text-sm text-gray-500 flex items-center">
                          {employee.phone || "-"}
                        </span>
                        {/* Role */}
                        <span className="px-6 py-4 flex items-center">
                          <Badge
                            variant={
                              employee.role === "OWNER"
                                ? "error"
                                : employee.role === "ADMIN"
                                ? "secondary"
                                : "default"
                            }
                            size="sm">
                            {employee.role}
                          </Badge>
                        </span>
                        {/* Completed Jobs */}
                        <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
                          {employee.completedJobsCount}
                        </span>
                        {/* Active Jobs */}
                        <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
                          {employee.activeJobsCount > 0 ? (
                            <Badge variant="alara" size="sm">
                              {employee.activeJobsCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </span>
                        {/* Total Revenue */}
                        <span className="px-6 py-4 text-sm font-medium text-green-600 flex items-center">
                          ${employee.totalRevenue.toFixed(2)}
                        </span>
                        {/* Actions */}
                        <span className="px-6 py-4 text-right text-sm flex items-center justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            href={`/employees/${employee.id}`}
                            className="text-neutral-500 hover:text-neutral-700">
                            View Details
                            <ChevronRight size={12} className="ml-1" />
                          </Button>
                        </span>
                      </div>
                    ))}
                    {/* Placeholder rows to fill up to minimum display rows */}
                    {placeholderRowCount > 0 &&
                      Array.from({ length: placeholderRowCount }).map(
                        (_, idx) => (
                          <div
                            key={`placeholder-${idx}`}
                            className="grid grid-cols-8 h-16">
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
        <EmployeePagination
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          nextCursor={nextCursor}
          prevCursor={prevCursor}
          currentCount={employeeStats.length}
          perPage={perPage}
          minDisplayRows={minDisplayRows}
        />
      </div>
    </EmployeeLoadingProvider>
  );
}
