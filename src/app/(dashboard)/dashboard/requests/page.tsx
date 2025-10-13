import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function RequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const requests = await db.inventoryRequest.findMany({
    include: {
      employee: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch products and kits for displaying names
  const products = await db.product.findMany();
  const kits = await db.kit.findMany();

  const productMap = new Map(products.map((p) => [p.id, p]));
  const kitMap = new Map(kits.map((k) => [k.id, k]));

  async function updateRequestStatus(formData: FormData) {
    "use server";

    const requestId = formData.get("requestId") as string;
    const status = formData.get("status") as string;

    await db.inventoryRequest.update({
      where: { id: requestId },
      data: {
        status: status as "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED",
      },
    });

    revalidatePath("/dashboard/requests");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Inventory Requests</h1>

      <div className="grid gap-4 mb-6 md:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Requests
          </div>
          <div className="text-2xl font-bold">{requests.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter((r) => r.status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Approved</div>
          <div className="text-2xl font-bold text-blue-600">
            {requests.filter((r) => r.status === "APPROVED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Fulfilled
          </div>
          <div className="text-2xl font-bold text-green-600">
            {requests.filter((r) => r.status === "FULFILLED").length}
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No inventory requests yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const item = request.productId
                  ? productMap.get(request.productId)
                  : request.kitId
                  ? kitMap.get(request.kitId)
                  : null;

                return (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.employee.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        {item?.name || "Unknown"}
                        <span className="text-xs text-gray-500 ml-2">
                          ({request.productId ? "Product" : "Kit"})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {request.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {request.status === "PENDING" && (
                        <form
                          action={updateRequestStatus}
                          className="inline-flex space-x-2">
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <button
                            type="submit"
                            name="status"
                            value="APPROVED"
                            className="text-blue-600 hover:text-blue-900">
                            Approve
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="REJECTED"
                            className="text-red-600 hover:text-red-900">
                            Reject
                          </button>
                        </form>
                      )}
                      {request.status === "APPROVED" && (
                        <form action={updateRequestStatus} className="inline">
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />
                          <button
                            type="submit"
                            name="status"
                            value="FULFILLED"
                            className="text-green-600 hover:text-green-900">
                            Mark Fulfilled
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
