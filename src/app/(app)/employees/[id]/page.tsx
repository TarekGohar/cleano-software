import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function EmployeePage({
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

  // Admin only - OWNER or ADMIN
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    redirect("");
  }

  const employee = await db.user.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          productUsage: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        take: 10,
      },
      inventoryRequests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!employee) {
    redirect("/employees");
  }

  async function assignKit(formData: FormData) {
    "use server";

    const kitId = formData.get("kitId") as string;

    await db.employeeKit.create({
      data: {
        userId: id,
        kitId,
      },
    });

    revalidatePath(`/employees/${id}`);
  }

  async function removeKit(formData: FormData) {
    "use server";

    const kitId = formData.get("kitId") as string;

    await db.employeeKit.delete({
      where: {
        userId_kitId: {
          userId: id,
          kitId,
        },
      },
    });

    revalidatePath(`/employees/${id}`);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/employees"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Employees
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <p className="text-gray-600 mt-1">{employee.email}</p>
            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 mt-2">
              {employee.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
          {employee.jobs.length === 0 ? (
            <p className="text-gray-500">No jobs logged yet.</p>
          ) : (
            <div className="space-y-3">
              {employee.jobs.map((job) => (
                <div key={job.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium">{job.clientName}</div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : job.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(job.startTime).toLocaleDateString()}
                  </div>
                  {job.productUsage.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Used {job.productUsage.length} product(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Recent Inventory Requests
        </h2>
        {employee.inventoryRequests.length === 0 ? (
          <p className="text-gray-500">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employee.inventoryRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {request.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {request.reason || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === "FULFILLED"
                            ? "bg-green-100 text-green-800"
                            : request.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : request.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {request.status}
                      </span>
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
