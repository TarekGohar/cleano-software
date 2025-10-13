import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export default async function EditJobPage({
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

  const job = await db.job.findUnique({
    where: { id },
    include: {
      productUsage: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!job || job.employeeId !== session.user.id) {
    redirect("/dashboard/jobs");
  }

  const allProducts = await db.product.findMany({
    orderBy: { name: "asc" },
  });

  async function updateJob(formData: FormData) {
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
    const newProductUsage: {
      productId: string;
      quantity: number;
      notes?: string;
    }[] = [];

    allProducts.forEach((product) => {
      const quantity = formData.get(`quantity_${product.id}`);
      const notes = formData.get(`notes_${product.id}`) as string;

      if (quantity && parseFloat(quantity as string) > 0) {
        newProductUsage.push({
          productId: product.id,
          quantity: parseFloat(quantity as string),
          notes: notes || undefined,
        });
      }
    });

    // Calculate stock adjustments
    const job = await db.job.findUnique({
      where: { id },
      include: {
        productUsage: true,
      },
    });

    if (job) {
      // Restore previous usage back to stock
      for (const usage of job.productUsage) {
        await db.product.update({
          where: { id: usage.productId },
          data: {
            stockLevel: {
              increment: usage.quantity,
            },
          },
        });
      }

      // Delete old usage records
      await db.jobProductUsage.deleteMany({
        where: { jobId: id },
      });

      // Update job and add new usage
      await db.job.update({
        where: { id },
        data: {
          clientName,
          location: location || null,
          description: description || null,
          startTime,
          endTime,
          status: status as "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
          productUsage: {
            create: newProductUsage,
          },
        },
      });

      // Deduct new usage from stock
      for (const usage of newProductUsage) {
        await db.product.update({
          where: { id: usage.productId },
          data: {
            stockLevel: {
              decrement: usage.quantity,
            },
          },
        });
      }
    }

    revalidatePath("/dashboard/jobs");
    redirect(`/dashboard/jobs/${id}`);
  }

  async function deleteJob() {
    "use server";

    // Restore stock levels
    const job = await db.job.findUnique({
      where: { id },
      include: {
        productUsage: true,
      },
    });

    if (job) {
      for (const usage of job.productUsage) {
        await db.product.update({
          where: { id: usage.productId },
          data: {
            stockLevel: {
              increment: usage.quantity,
            },
          },
        });
      }

      await db.job.delete({
        where: { id },
      });
    }

    revalidatePath("/dashboard/jobs");
    redirect("/dashboard/jobs");
  }

  // Create a map of current product usage
  const currentUsage = new Map(
    job.productUsage.map((usage) => [
      usage.productId,
      { quantity: usage.quantity, notes: usage.notes || "" },
    ])
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Edit Job</h1>

      <form
        action={updateJob}
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
            defaultValue={job.clientName}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            defaultValue={job.location || ""}
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
            defaultValue={job.description || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              defaultValue={new Date(job.startTime).toISOString().slice(0, 16)}
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
              defaultValue={job.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div
          id="endTimeContainer"
          style={{ display: job.endTime ? "block" : "none" }}>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            defaultValue={
              job.endTime
                ? new Date(job.endTime).toISOString().slice(0, 16)
                : ""
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Usage
          </label>
          <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {allProducts.map((product) => {
              const usage = currentUsage.get(product.id);
              return (
                <div key={product.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Available: {product.stockLevel + (usage?.quantity || 0)}{" "}
                        {product.unit}
                      </div>
                    </div>
                    <input
                      type="number"
                      name={`quantity_${product.id}`}
                      step="0.01"
                      min="0"
                      max={product.stockLevel + (usage?.quantity || 0)}
                      defaultValue={usage?.quantity || 0}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 ml-2 mt-2">
                      {product.unit}
                    </span>
                  </div>
                  <input
                    type="text"
                    name={`notes_${product.id}`}
                    placeholder="Optional notes"
                    defaultValue={usage?.notes || ""}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <form action={deleteJob}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Delete Job
            </button>
          </form>
          <div className="flex space-x-4">
            <a
              href={`/dashboard/jobs/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </a>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Job
            </button>
          </div>
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
