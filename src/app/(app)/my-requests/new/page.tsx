import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function NewRequestPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const products = await db.product.findMany({
    orderBy: { name: "asc" },
  });

  async function createRequest(formData: FormData) {
    "use server";

    const requestType = formData.get("requestType") as string;
    const quantity = parseFloat(formData.get("quantity") as string);
    const reason = formData.get("reason") as string;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const data: any = {
      employeeId: session!.user.id,
      quantity,
      reason: reason || null,
      status: "PENDING",
    };

    if (requestType === "product") {
      data.productId = formData.get("productId") as string;
    } else {
      data.kitId = formData.get("kitId") as string;
    }

    await db.inventoryRequest.create({
      data,
    });

    revalidatePath("/my-requests");
    redirect("/my-requests");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">New Inventory Request</h1>

      <form
        action={createRequest}
        className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Request Type *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="requestType"
                value="product"
                required
                className="mr-2"
              />
              <span>Individual Product</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="requestType"
                value="kit"
                required
                className="mr-2"
              />
              <span>Full Kit</span>
            </label>
          </div>
        </div>

        <div id="productSelect" style={{ display: "none" }}>
          <label
            htmlFor="productId"
            className="block text-sm font-medium text-gray-700 mb-1">
            Select Product *
          </label>
          <select
            id="productId"
            name="productId"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Choose a product...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (Available: {product.stockLevel} {product.unit})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            required
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Request
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional: Explain why you need this inventory"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <a
            href="/my-requests"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Submit Request
          </button>
        </div>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const requestTypeRadios = document.querySelectorAll('input[name="requestType"]');
            const productSelect = document.getElementById('productSelect');
            const productIdInput = document.getElementById('productId');
            const kitIdInput = document.getElementById('kitId');

            requestTypeRadios.forEach(radio => {
              radio.addEventListener('change', function() {
                if (this.value === 'product') {
                  productSelect.style.display = 'block';
                  productIdInput.required = true;
                  kitIdInput.required = false;
                } else {
                  productSelect.style.display = 'none';
                  productIdInput.required = false;
                  kitIdInput.required = true;
                }
              });
            });
          `,
        }}
      />
    </div>
  );
}
