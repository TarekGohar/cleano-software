import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

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

  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const product = await db.product.findUnique({
    where: { id },
  });

  if (!product) {
    redirect("/products");
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

    revalidatePath("/products");
    redirect("/products");
  }

  async function deleteProduct() {
    "use server";

    await db.product.delete({
      where: { id },
    });

    revalidatePath("/products");
    redirect("/products");
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            href="/products"
            submit={false}
            className="!px-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        </div>
      </Card>

      {/* Edit Form */}
      <Card variant="default">
        <form action={updateProduct} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={product.name}
              variant="default"
              size="md"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description || ""}
              variant="default"
              size="md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Unit *
              </label>
              <Input
                type="text"
                id="unit"
                name="unit"
                required
                defaultValue={product.unit}
                variant="default"
                size="md"
              />
            </div>

            <div>
              <label
                htmlFor="costPerUnit"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Cost per Unit ($) *
              </label>
              <Input
                type="number"
                id="costPerUnit"
                name="costPerUnit"
                required
                step="0.01"
                min="0"
                defaultValue={product.costPerUnit}
                variant="default"
                size="md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stockLevel"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock Level *
              </label>
              <Input
                type="number"
                id="stockLevel"
                name="stockLevel"
                required
                step="0.01"
                min="0"
                defaultValue={product.stockLevel}
                variant="default"
                size="md"
              />
            </div>

            <div>
              <label
                htmlFor="minStock"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Stock Alert *
              </label>
              <Input
                type="number"
                id="minStock"
                name="minStock"
                required
                step="0.01"
                min="0"
                defaultValue={product.minStock}
                variant="default"
                size="md"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <form action={deleteProduct}>
              <Button type="submit" variant="destructive" size="md">
                Delete Product
              </Button>
            </form>
            <div className="flex gap-3">
              <Button variant="outline" size="md" href="/products">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Update Product
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
