"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Edit2, Pencil, Trash2 } from "lucide-react";

interface InventoryItemProps {
  assignment: {
    id: string;
    quantity: number;
    notes: string | null;
    assignedAt?: Date;
    product: {
      id: string;
      name: string;
      unit: string;
      costPerUnit?: number;
      minStock?: number;
    };
  };
  removeAction: (formData: FormData) => Promise<void>;
  onEdit?: () => void;
  useFullWidth?: boolean;
}

export default function InventoryItem({
  assignment,
  removeAction,
  onEdit,
  useFullWidth = true,
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

  const itemValue = assignment.quantity * (assignment.product.costPerUnit || 0);
  const isLowStock =
    assignment.quantity <= (assignment.product.minStock || 0) &&
    assignment.quantity > 0;
  const isOutOfStock = assignment.quantity === 0;

  const formatDate = (date?: Date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Use 5-column layout for old view, 6-column for new view
  const gridCols = useFullWidth ? "grid-cols-5" : "grid-cols-6";

  return (
    <div
      className={`grid ${gridCols} hover:bg-gray-50/50 transition-colors items-center group`}>
      {/* Product Name */}
      <div className="px-6 py-4">
        <span className="text-sm font-[450] text-gray-900">
          {assignment.product.name}
        </span>
      </div>

      {/* Quantity */}
      <div className="px-6 py-4 flex items-center gap-2">
        <span className="text-sm text-gray-900">
          {assignment.quantity} {assignment.product.unit}
        </span>
        {isOutOfStock && (
          <Badge variant="error" size="sm">
            Out
          </Badge>
        )}
        {isLowStock && (
          <Badge variant="warning" size="sm">
            Low
          </Badge>
        )}
      </div>

      {/* Value (only in 6-column) */}
      {!useFullWidth && (
        <div className="px-6 py-4">
          <span className="text-sm font-[450] text-green-600">
            ${itemValue.toFixed(2)}
          </span>
        </div>
      )}

      {/* Assigned Date (only in 6-column) */}
      {!useFullWidth && (
        <div className="px-6 py-4">
          <span className="text-sm text-gray-500">
            {formatDate(assignment.assignedAt)}
          </span>
        </div>
      )}

      {/* Notes */}
      <div className={`px-6 py-4 ${useFullWidth ? "col-span-2" : ""}`}>
        <span className="text-sm text-gray-600">{assignment.notes || "-"}</span>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 text-right flex items-center justify-end gap-2">
        {onEdit && (
          <Button
            onClick={onEdit}
            variant="default"
            size="sm"
            submit={false}
            className="">
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
        <form onSubmit={handleRemove} className="inline">
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <Button
            type="submit"
            disabled={isRemoving}
            variant="destructive"
            size="sm"
            className="">
            {isRemoving ? (
              <span className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Trash2 className="w-3 h-3 mr-1" />
            )}
            Remove
          </Button>
        </form>
      </div>
    </div>
  );
}
