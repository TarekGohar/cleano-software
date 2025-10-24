import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function EmployeesPage() {
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

  const employees = await db.user.findMany({
    include: {
      jobs: {
        include: {
          productUsage: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate summary stats for each employee
  const employeeStats = employees.map((emp) => {
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

  return (
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

      {/* Employees Table */}
      <Card variant="default">
        <div className="overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeStats.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          {employee.unpaidJobs > 0 && (
                            <div className="text-xs text-orange-600 mt-0.5">
                              {employee.unpaidJobs} unpaid job
                              {employee.unpaidJobs > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.completedJobsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.activeJobsCount > 0 ? (
                        <Badge variant="alara" size="sm">
                          {employee.activeJobsCount}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${employee.totalRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button
                        variant="default"
                        size="sm"
                        href={`/employees/${employee.id}`}>
                        View Details →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
