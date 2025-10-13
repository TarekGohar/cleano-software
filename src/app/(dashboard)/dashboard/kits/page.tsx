import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";

export default async function KitsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const kits = await db.kit.findMany({
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
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kits</h1>
        <Link
          href="/dashboard/kits/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Kit
        </Link>
      </div>

      {kits.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">
            No kits found. Create your first kit to bundle products together.
          </p>
          <Link
            href="/dashboard/kits/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Your First Kit
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{kit.name}</h2>
                  {kit.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {kit.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm font-medium text-gray-700">
                  Products ({kit.products.length}):
                </div>
                {kit.products.slice(0, 3).map((kitProduct) => (
                  <div
                    key={kitProduct.id}
                    className="text-sm text-gray-600 flex justify-between">
                    <span>{kitProduct.product.name}</span>
                    <span>
                      {kitProduct.quantity} {kitProduct.product.unit}
                    </span>
                  </div>
                ))}
                {kit.products.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{kit.products.length - 3} more...
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-3">
                  Assigned to {kit.employeeKits.length} employee(s)
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/kits/${kit.id}`}
                    className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                    View
                  </Link>
                  <Link
                    href={`/dashboard/kits/${kit.id}/edit`}
                    className="flex-1 px-3 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
