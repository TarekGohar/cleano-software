import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import Link from "next/link";

export default async function ProductPage({
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

  const product = await db.product.findUnique({
    where: { id },
    include: {
      kitProducts: {
        include: {
          kit: true,
        },
      },
      jobUsage: {
        include: {
          job: {
            include: {
              employee: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!product) {
    redirect("/dashboard/products");
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Products
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="text-gray-600 mt-2">{product.description}</p>
            )}
          </div>
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Stock Level
          </div>
          <div className="text-2xl font-bold">
            {product.stockLevel} {product.unit}
          </div>
          {product.stockLevel <= product.minStock && (
            <div className="text-sm text-red-600 mt-1">
              Below minimum stock!
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Cost per Unit
          </div>
          <div className="text-2xl font-bold">
            ${product.costPerUnit.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Min Stock Alert
          </div>
          <div className="text-2xl font-bold">
            {product.minStock} {product.unit}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Value
          </div>
          <div className="text-2xl font-bold">
            ${(product.stockLevel * product.costPerUnit).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Used in Kits</h2>
          {product.kitProducts.length === 0 ? (
            <p className="text-gray-500">Not included in any kits yet.</p>
          ) : (
            <div className="space-y-2">
              {product.kitProducts.map((kitProduct) => (
                <div
                  key={kitProduct.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <Link
                    href={`/dashboard/kits/${kitProduct.kit.id}`}
                    className="text-blue-600 hover:text-blue-800">
                    {kitProduct.kit.name}
                  </Link>
                  <span className="text-sm text-gray-600">
                    {kitProduct.quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Usage</h2>
          {product.jobUsage.length === 0 ? (
            <p className="text-gray-500">No usage recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {product.jobUsage.map((usage) => (
                <div
                  key={usage.id}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{usage.job.clientName}</div>
                    <div className="text-sm text-gray-600">
                      by {usage.job.employee.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(usage.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {usage.quantity} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
