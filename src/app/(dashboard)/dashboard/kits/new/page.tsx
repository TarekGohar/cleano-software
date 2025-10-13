import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function NewKitPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const products = await db.product.findMany({
    orderBy: { name: "asc" },
  });

  async function createKit(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Get selected products and quantities
    const selectedProducts: { productId: string; quantity: number }[] = [];

    products.forEach((product) => {
      const quantity = formData.get(`quantity_${product.id}`);
      if (quantity && parseFloat(quantity as string) > 0) {
        selectedProducts.push({
          productId: product.id,
          quantity: parseFloat(quantity as string),
        });
      }
    });

    if (selectedProducts.length === 0) {
      throw new Error("Please add at least one product to the kit");
    }

    await db.kit.create({
      data: {
        name,
        description: description || null,
        products: {
          create: selectedProducts.map((sp) => ({
            productId: sp.productId,
            quantity: sp.quantity,
          })),
        },
      },
    });

    revalidatePath("/dashboard/kits");
    redirect("/dashboard/kits");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create New Kit</h1>

      <form
        action={createKit}
        className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1">
            Kit Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Basic Cleaning Kit"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Products in Kit *
          </label>
          {products.length === 0 ? (
            <div className="text-gray-500 text-sm">
              No products available. Please add products first.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      Available: {product.stockLevel} {product.unit}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      name={`quantity_${product.id}`}
                      step="0.01"
                      min="0"
                      defaultValue="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600 w-16">
                      {product.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <a
            href="/dashboard/kits"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={products.length === 0}>
            Create Kit
          </button>
        </div>
      </form>
    </div>
  );
}
