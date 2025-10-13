import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function EditProductPage({
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
  });

  if (!product) {
    redirect("/dashboard/products");
  }

  async function updateProduct(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const unit = formData.get("unit") as string;
    const costPerUnit = parseFloat(formData.get("costPerUnit") as string);
    const stockLevel = parseFloat(formData.get("stockLevel") as string);
    const minStock = parseFloat(formData.get("minStock") as string);

    await db.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        unit,
        costPerUnit,
        stockLevel,
        minStock,
      },
    });

    revalidatePath("/dashboard/products");
    redirect("/dashboard/products");
  }

  async function deleteProduct() {
    "use server";

    await db.product.delete({
      where: { id },
    });

    revalidatePath("/dashboard/products");
    redirect("/dashboard/products");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

      <form
        action={updateProduct}
        className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={product.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product.description || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              required
              defaultValue={product.unit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="costPerUnit"
              className="block text-sm font-medium text-gray-700 mb-1">
              Cost per Unit ($) *
            </label>
            <input
              type="number"
              id="costPerUnit"
              name="costPerUnit"
              required
              step="0.01"
              min="0"
              defaultValue={product.costPerUnit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="stockLevel"
              className="block text-sm font-medium text-gray-700 mb-1">
              Stock Level *
            </label>
            <input
              type="number"
              id="stockLevel"
              name="stockLevel"
              required
              step="0.01"
              min="0"
              defaultValue={product.stockLevel}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="minStock"
              className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stock Alert *
            </label>
            <input
              type="number"
              id="minStock"
              name="minStock"
              required
              step="0.01"
              min="0"
              defaultValue={product.minStock}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <form action={deleteProduct}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Delete Product
            </button>
          </form>
          <div className="flex space-x-4">
            <a
              href="/dashboard/products"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </a>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
