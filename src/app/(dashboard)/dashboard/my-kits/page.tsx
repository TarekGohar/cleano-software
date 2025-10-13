import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";

export default async function MyKitsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const employeeKits = await db.employeeKit.findMany({
    where: {
      userId: session.user.id,
    },
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
    orderBy: {
      assignedAt: "desc",
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Assigned Kits</h1>

      {employeeKits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">
            You don't have any kits assigned yet. Contact your manager to get
            kits assigned.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employeeKits.map((employeeKit) => {
            const kit = employeeKit.kit;
            const totalValue = kit.products.reduce(
              (sum, kp) => sum + kp.quantity * kp.product.costPerUnit,
              0
            );

            return (
              <div
                key={employeeKit.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{kit.name}</h2>
                  {kit.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {kit.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Assigned{" "}
                    {new Date(employeeKit.assignedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Products ({kit.products.length}):
                  </div>
                  <div className="space-y-2">
                    {kit.products.map((kitProduct) => (
                      <div
                        key={kitProduct.id}
                        className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {kitProduct.product.name}
                        </span>
                        <span className="text-gray-600">
                          {kitProduct.quantity} {kitProduct.product.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Total Value:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ${totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
