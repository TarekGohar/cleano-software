import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import CleanerSelector from "./CleanerSelector";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

export default async function JobFormPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit: jobId } = await searchParams;
  const isEditing = !!jobId;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Get existing job if editing
  let existingJob = null;
  if (isEditing) {
    existingJob = await db.job.findUnique({
      where: { id: jobId },
      include: {
        cleaners: true,
        productUsage: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingJob || existingJob.employeeId !== session.user.id) {
      redirect("/jobs");
    }
  }

  // Get all users to populate the cleaners dropdown
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Get all products for product usage section
  const allProducts = await db.product.findMany({
    orderBy: { name: "asc" },
  });

  async function saveJob(formData: FormData) {
    "use server";

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get selected cleaner IDs from form
    const cleanerIds = formData.getAll("cleaners") as string[];

    // Parse all form fields according to schema
    const jobData: any = {
      employeeId: session!.user.id,
      clientName: formData.get("clientName") as string,
      description: (formData.get("description") as string) || null,
      jobType: (formData.get("jobType") as string) || null,
      location: (formData.get("location") as string) || null,
      jobDate: formData.get("jobDate")
        ? new Date(formData.get("jobDate") as string)
        : null,
      startTime:
        formData.get("startTime") && formData.get("jobDate")
          ? new Date(`${formData.get("jobDate")}T${formData.get("startTime")}`)
          : new Date(),
      endTime:
        formData.get("endTime") && formData.get("jobDate")
          ? new Date(`${formData.get("jobDate")}T${formData.get("endTime")}`)
          : null,
      status:
        (formData.get("status") as "IN_PROGRESS" | "COMPLETED" | "CANCELLED") ||
        "IN_PROGRESS",
      price: formData.get("price")
        ? parseFloat(formData.get("price") as string)
        : null,
      employeePay: formData.get("employeePay")
        ? parseFloat(formData.get("employeePay") as string)
        : null,
      totalTip: formData.get("totalTip")
        ? parseFloat(formData.get("totalTip") as string)
        : null,
      parking: formData.get("parking")
        ? parseFloat(formData.get("parking") as string)
        : null,
      paymentReceived: formData.get("paymentReceived") === "on",
      invoiceSent: formData.get("invoiceSent") === "on",
      notes: (formData.get("notes") as string) || null,
    };

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

    const editingJobId = formData.get("jobId") as string | null;

    if (editingJobId) {
      // UPDATE existing job
      const existingJob = await db.job.findUnique({
        where: { id: editingJobId },
        include: {
          productUsage: true,
        },
      });

      if (existingJob) {
        // Restore previous usage back to stock
        for (const usage of existingJob.productUsage) {
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
          where: { jobId: editingJobId },
        });

        // Update job
        await db.job.update({
          where: { id: editingJobId },
          data: {
            ...jobData,
            cleaners:
              cleanerIds.length > 0
                ? {
                    set: cleanerIds.map((id) => ({ id })),
                  }
                : undefined,
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

        revalidatePath("/jobs");
        redirect(`/jobs/${editingJobId}`);
      }
    } else {
      // CREATE new job
      // Only add cleaners if there are any selected
      if (cleanerIds.length > 0) {
        jobData.cleaners = {
          connect: cleanerIds.map((id) => ({ id })),
        };
      }

      // Add product usage
      if (newProductUsage.length > 0) {
        jobData.productUsage = {
          create: newProductUsage,
        };
      }

      const newJob = await db.job.create({
        data: jobData,
      });

      // Deduct usage from stock
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

      revalidatePath("/jobs");
      redirect("/jobs");
    }
  }

  async function deleteJob(formData: FormData) {
    "use server";

    const jobId = formData.get("jobId") as string;

    // Restore stock levels
    const job = await db.job.findUnique({
      where: { id: jobId },
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
        where: { id: jobId },
      });
    }

    revalidatePath("/jobs");
    redirect("/jobs");
  }

  // Create a map of current product usage for editing
  const currentUsage = new Map(
    existingJob?.productUsage.map((usage) => [
      usage.productId,
      { quantity: usage.quantity, notes: usage.notes || "" },
    ]) || []
  );

  // Get selected cleaner IDs for editing
  const selectedCleanerIds = existingJob?.cleaners.map((c) => c.id) || [];

  return (
    <div className="max-w-5xl mx-auto text-black">
      <Card variant="default" className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "#005F6A" }}>
          {isEditing ? "Edit Cleaning Job" : "Create New Cleaning Job"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? "Update the details for your cleaning job"
            : "Fill in the details for your cleaning job"}
        </p>
      </Card>

      <form action={saveJob} className="space-y-6">
        {/* Hidden field for job ID when editing */}
        {isEditing && existingJob && (
          <input type="hidden" name="jobId" value={existingJob.id} />
        )}
        {/* Basic Information */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="clientName"
                name="clientName"
                required
                defaultValue={existingJob?.clientName || ""}
                placeholder="e.g., Alexis Juarez"
              />
            </div>

            <div>
              <label
                htmlFor="jobType"
                className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <Select
                id="jobType"
                name="jobType"
                defaultValue={existingJob?.jobType || ""}
                options={[
                  { value: "", label: "Select Type" },
                  { value: "R", label: "R - Residential" },
                  { value: "C", label: "C - Commercial" },
                  { value: "PC", label: "PC - Post Construction" },
                  { value: "F", label: "F - Follow-up" },
                ]}
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                type="text"
                id="location"
                name="location"
                defaultValue={existingJob?.location || ""}
                placeholder="Address or area"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={existingJob?.description || ""}
                placeholder="Brief description of the job..."
              />
            </div>
          </div>
        </Card>

        {/* Date & Time */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Date & Time
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="jobDate"
                className="block text-sm font-medium text-gray-700 mb-1">
                Job Date
              </label>
              <Input
                type="date"
                id="jobDate"
                name="jobDate"
                defaultValue={
                  existingJob?.jobDate
                    ? new Date(existingJob.jobDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <Input
                type="time"
                id="startTime"
                name="startTime"
                defaultValue={
                  existingJob
                    ? new Date(existingJob.startTime)
                        .toISOString()
                        .split("T")[1]
                        .slice(0, 5)
                    : ""
                }
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <Input
                type="time"
                id="endTime"
                name="endTime"
                defaultValue={
                  existingJob?.endTime
                    ? new Date(existingJob.endTime)
                        .toISOString()
                        .split("T")[1]
                        .slice(0, 5)
                    : ""
                }
              />
            </div>
          </div>
        </Card>

        {/* Team & Hours */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Team
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <CleanerSelector
                users={users}
                initialSelectedIds={selectedCleanerIds}
              />
            </div>
          </div>
        </Card>

        {/* Product Usage */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Product Usage
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {allProducts.map((product) => {
              const usage = currentUsage.get(product.id);
              return (
                <div key={product.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Available: {product.stockLevel + (usage?.quantity || 0)}{" "}
                        {product.unit}
                      </div>
                    </div>
                    <Input
                      type="number"
                      name={`quantity_${product.id}`}
                      step="0.01"
                      min="0"
                      max={product.stockLevel + (usage?.quantity || 0)}
                      defaultValue={usage?.quantity || 0}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 ml-2 mt-2">
                      {product.unit}
                    </span>
                  </div>
                  <Input
                    type="text"
                    name={`notes_${product.id}`}
                    placeholder="Optional notes"
                    defaultValue={usage?.notes || ""}
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pricing & Payment */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Pricing & Payment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  defaultValue={existingJob?.price || ""}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="employeePay"
                className="block text-sm font-medium text-gray-700 mb-1">
                Employee Pay
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  id="employeePay"
                  name="employeePay"
                  defaultValue={existingJob?.employeePay || ""}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="totalTip"
                className="block text-sm font-medium text-gray-700 mb-1">
                Total Tip
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  id="totalTip"
                  name="totalTip"
                  defaultValue={existingJob?.totalTip || ""}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="parking"
                className="block text-sm font-medium text-gray-700 mb-1">
                Parking
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  id="parking"
                  name="parking"
                  defaultValue={existingJob?.parking || ""}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6 md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="paymentReceived"
                  defaultChecked={existingJob?.paymentReceived || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Payment Received
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="invoiceSent"
                  defaultChecked={existingJob?.invoiceSent || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Invoice Sent</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Notes & Status */}
        <Card variant="default">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#005F6A" }}>
            Additional Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={existingJob?.notes || ""}
                placeholder="Any additional notes or special requirements..."
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                id="status"
                name="status"
                defaultValue={existingJob?.status || "IN_PROGRESS"}
                options={[
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          {isEditing && existingJob && (
            <form action={deleteJob}>
              <input type="hidden" name="jobId" value={existingJob.id} />
              <Button type="submit" variant="destructive">
                Delete Job
              </Button>
            </form>
          )}
          <div className={`flex space-x-4 ${!isEditing ? "ml-auto" : ""}`}>
            <a href={isEditing ? `/jobs/${existingJob?.id}` : "/jobs"}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </a>
            <Button type="submit" variant="primary">
              {isEditing ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
