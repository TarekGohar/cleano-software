"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Product {
  id: string;
  name: string;
  stockLevel: number;
  unit: string;
}

export default function ProductAssignmentForm({
  availableProducts,
  assignAction,
}: {
  availableProducts: Product[];
  assignAction: (formData: FormData) => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    await assignAction(formData);

    // Reset form
    setProductId("");
    setQuantity("");
    setNotes("");
    setIsSubmitting(false);
  };

  if (availableProducts.length === 0) {
    return null;
  }

  const productOptions = [
    { value: "", label: "Select a product..." },
    ...availableProducts.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.stockLevel} ${product.unit})`,
    })),
  ];

  return (
    <Card variant="alara_light_bordered">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">
          Assign Product
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product
            </label>
            <Select
              name="productId"
              value={productId}
              onChange={setProductId}
              required
              options={productOptions}
              variant="default"
              size="md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity
            </label>
            <Input
              type="number"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              variant="default"
              size="md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (optional)
            </label>
            <Input
              type="text"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For Route A"
              variant="default"
              size="md"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="md"
          className="w-full">
          {isSubmitting ? "Assigning..." : "Assign Product"}
        </Button>
      </form>
    </Card>
  );
}
