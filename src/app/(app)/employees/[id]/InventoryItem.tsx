"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface InventoryItemProps {
  assignment: {
    id: string;
    quantity: number;
    notes: string | null;
    product: {
      name: string;
      unit: string;
    };
  };
  updateAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
}

export default function InventoryItem({
  assignment,
  updateAction,
  removeAction,
}: InventoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(assignment.quantity.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    await updateAction(formData);

    setIsEditing(false);
    setIsSubmitting(false);
  };

  const handleRemove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirm(`Remove ${assignment.product.name} from inventory?`)) {
      const formData = new FormData(e.currentTarget);
      await removeAction(formData);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-[#005F6A]/5 rounded-lg border border-[#005F6A]/10 hover:border-[#005F6A]/20 transition">
      <div className="flex-1">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex items-center gap-2">
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <span className="font-medium text-gray-900 text-sm">
              {assignment.product.name}
            </span>
            <Input
              type="number"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.01"
              min="0.01"
              required
              variant="default"
              size="sm"
              className="w-20"
              autoFocus
            />
            <span className="text-sm text-gray-600">
              {assignment.product.unit}
            </span>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              size="sm"
              submit={true}>
              {isSubmitting ? "..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setQuantity(assignment.quantity.toString());
                setIsEditing(false);
              }}
              variant="ghost"
              size="sm"
              submit={false}>
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {assignment.product.name}
            </span>
            <span className="text-sm text-gray-600">
              {assignment.quantity} {assignment.product.unit}
            </span>
            {assignment.notes && (
              <span className="text-xs text-gray-500">
                • {assignment.notes}
              </span>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={() => setIsEditing(true)}
            variant="default"
            size="sm"
            submit={false}>
            Edit
          </Button>
          <form onSubmit={handleRemove}>
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Button type="submit" variant="destructive" size="sm">
              Remove
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
