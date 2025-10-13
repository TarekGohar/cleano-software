import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";

export default async function KitPage({
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

  const kit = await db.kit.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      employeeKits: {
        include: {
          user: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
    },
  });

  if (!kit) {
    redirect("/dashboard/kits");
  }

  // Calculate total kit value
  const totalValue = kit.products.reduce((sum, kp) => {
    return sum + kp.quantity * kp.product.costPerUnit;
  }, 0);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/kits"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Kits
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{kit.name}</h1>
            {kit.description && (
              <p className="text-gray-600 mt-2">{kit.description}</p>
            )}
          </div>
          <Link
            href={`/dashboard/kits/${kit.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Kit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Products
          </div>
          <div className="text-2xl font-bold">{kit.products.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Assigned To
          </div>
          <div className="text-2xl font-bold">
            {kit.employeeKits.length} Employees
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Kit Value
          </div>
          <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Products in Kit</h2>
          {kit.products.length === 0 ? (
            <p className="text-gray-500">No products in this kit.</p>
          ) : (
            <div className="space-y-3">
              {kit.products.map((kitProduct) => (
                <div
                  key={kitProduct.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/products/${kitProduct.product.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800">
                      {kitProduct.product.name}
                    </Link>
                    {kitProduct.product.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {kitProduct.product.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      ${kitProduct.product.costPerUnit.toFixed(2)} per{" "}
                      {kitProduct.product.unit}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold">
                      {kitProduct.quantity} {kitProduct.product.unit}
                    </div>
                    <div className="text-sm text-gray-600">
                      $
                      {(
                        kitProduct.quantity * kitProduct.product.costPerUnit
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Assigned Employees</h2>
          {kit.employeeKits.length === 0 ? (
            <p className="text-gray-500">Not assigned to any employees yet.</p>
          ) : (
            <div className="space-y-2">
              {kit.employeeKits.map((employeeKit) => (
                <div
                  key={employeeKit.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{employeeKit.user.name}</div>
                    <div className="text-sm text-gray-600">
                      {employeeKit.user.email}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(employeeKit.assignedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
