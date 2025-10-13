import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function NewJobPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const products = await db.product.findMany({
    orderBy: { name: "asc" },
  });

  async function createJob(formData: FormData) {
    "use server";

    const clientName = formData.get("clientName") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;
    const startTime = new Date(formData.get("startTime") as string);
    const status = formData.get("status") as string;

    let endTime: Date | null = null;
    if (status === "COMPLETED") {
      endTime = new Date(formData.get("endTime") as string);
    }

    // Get product usage
    const productUsage: {
      productId: string;
      quantity: number;
      notes?: string;
    }[] = [];

    products.forEach((product) => {
      const quantity = formData.get(`quantity_${product.id}`);
      const notes = formData.get(`notes_${product.id}`) as string;

      if (quantity && parseFloat(quantity as string) > 0) {
        productUsage.push({
          productId: product.id,
          quantity: parseFloat(quantity as string),
          notes: notes || undefined,
        });
      }
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const job = await db.job.create({
      data: {
        employeeId: session!.user.id,
        clientName,
        location: location || null,
        description: description || null,
        startTime,
        endTime,
        status: status as "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
        productUsage: {
          create: productUsage,
        },
      },
    });

    // Update stock levels for used products
    for (const usage of productUsage) {
      await db.product.update({
        where: { id: usage.productId },
        data: {
          stockLevel: {
            decrement: usage.quantity,
          },
        },
      });
    }

    revalidatePath("/dashboard/jobs");
    redirect("/dashboard/jobs");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Log New Job</h1>

      <form
        action={createJob}
        className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label
            htmlFor="clientName"
            className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Smith Residence"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 123 Main St"
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
            placeholder="Optional job description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div id="endTimeContainer" style={{ display: "none" }}>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Usage
          </label>
          {products.length === 0 ? (
            <div className="text-gray-500 text-sm">No products available.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {products.map((product) => (
                <div key={product.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Available: {product.stockLevel} {product.unit}
                      </div>
                    </div>
                    <input
                      type="number"
                      name={`quantity_${product.id}`}
                      step="0.01"
                      min="0"
                      max={product.stockLevel}
                      defaultValue="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-600 ml-2 mt-2">
                      {product.unit}
                    </span>
                  </div>
                  <input
                    type="text"
                    name={`notes_${product.id}`}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <a
            href="/dashboard/jobs"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Log Job
          </button>
        </div>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('status').addEventListener('change', function() {
              const endTimeContainer = document.getElementById('endTimeContainer');
              if (this.value === 'COMPLETED') {
                endTimeContainer.style.display = 'block';
                document.getElementById('endTime').required = true;
              } else {
                endTimeContainer.style.display = 'none';
                document.getElementById('endTime').required = false;
              }
            });
          `,
        }}
      />
    </div>
  );
}
