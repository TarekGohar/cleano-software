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

  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const employee = await db.user.findUnique({
    where: { id },
    include: {
      employeeKits: {
        include: {
          kit: {
            include: {
              products: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      },
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
    redirect("/dashboard/employees");
  }

  const availableKits = await db.kit.findMany({
    where: {
      NOT: {
        employeeKits: {
          some: {
            userId: id,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  async function assignKit(formData: FormData) {
    "use server";

    const kitId = formData.get("kitId") as string;

    await db.employeeKit.create({
      data: {
        userId: id,
        kitId,
      },
    });

    revalidatePath(`/dashboard/employees/${id}`);
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

    revalidatePath(`/dashboard/employees/${id}`);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/employees"
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
          <h2 className="text-xl font-semibold mb-4">Assigned Kits</h2>

          {availableKits.length > 0 && (
            <form action={assignKit} className="mb-4">
              <div className="flex space-x-2">
                <select
                  name="kitId"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a kit to assign...</option>
                  {availableKits.map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Assign
                </button>
              </div>
            </form>
          )}

          {employee.employeeKits.length === 0 ? (
            <p className="text-gray-500">No kits assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {employee.employeeKits.map((employeeKit) => (
                <div key={employeeKit.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        href={`/dashboard/kits/${employeeKit.kit.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800">
                        {employeeKit.kit.name}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">
                        Assigned{" "}
                        {new Date(employeeKit.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <form action={removeKit}>
                      <input
                        type="hidden"
                        name="kitId"
                        value={employeeKit.kit.id}
                      />
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </form>
                  </div>
                  <div className="text-sm text-gray-600">
                    {employeeKit.kit.products.length} product(s)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
