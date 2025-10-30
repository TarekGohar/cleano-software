"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Edit2, Trash2 } from "lucide-react";

interface InventoryItemProps {
  assignment: {
    id: string;
    quantity: number;
    notes: string | null;
    product: {
      id: string;
      name: string;
      unit: string;
    };
  };
  removeAction: (formData: FormData) => Promise<void>;
  onEdit: () => void;
}

export default function InventoryItem({
  assignment,
  removeAction,
  onEdit,
}: InventoryItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      confirm(
        `Remove ${assignment.product.name} from inventory?\n\nThis will return ${assignment.quantity} ${assignment.product.unit} to stock.`
      )
    ) {
      setIsRemoving(true);
      try {
        const formData = new FormData(e.currentTarget);
        await removeAction(formData);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="grid grid-cols-5 hover:bg-gray-50/50 transition-colors items-center group">
      {/* Product Name */}
      <div className="px-6 py-4">
        <span className="text-sm font-medium text-gray-900">
          {assignment.product.name}
        </span>
      </div>

      {/* Quantity */}
      <div className="px-6 py-4">
        <span className="text-sm text-gray-900">
          {assignment.quantity} {assignment.product.unit}
        </span>
      </div>

      {/* Notes */}
      <div className="px-6 py-4 col-span-2">
        <span className="text-sm text-gray-600">
          {assignment.notes || "-"}
        </span>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 text-right flex items-center justify-end gap-2">
        <Button
          onClick={onEdit}
          variant="ghost"
          size="sm"
          submit={false}
          className="opacity-0 group-hover:opacity-100 transition-opacity !px-3">
          <Edit2 className="w-4 h-4" />
        </Button>
        <form onSubmit={handleRemove} className="inline">
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <Button
            type="submit"
            disabled={isRemoving}
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity !px-3 hover:bg-red-50 hover:text-red-600">
            {isRemoving ? (
              <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
