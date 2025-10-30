"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stockLevel: number;
  unit: string;
}

interface Assignment {
  id: string;
  productId: string;
  quantity: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: Product[];
  assignAction: (formData: FormData) => Promise<void>;
  updateAction?: (formData: FormData) => Promise<void>;
  editingAssignment?: Assignment | null;
}

export default function InventoryModal({
  isOpen,
  onClose,
  availableProducts,
  assignAction,
  updateAction,
  editingAssignment,
}: InventoryModalProps) {
  const isEditing = !!editingAssignment;
  
  const [productId, setProductId] = useState(
    editingAssignment?.productId || ""
  );
  const [quantity, setQuantity] = useState(
    editingAssignment?.quantity.toString() || ""
  );
  const [notes, setNotes] = useState(editingAssignment?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (isOpen) {
      setProductId(editingAssignment?.productId || "");
      setQuantity(editingAssignment?.quantity.toString() || "");
      setNotes(editingAssignment?.notes || "");
    }
  }, [isOpen, editingAssignment]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      if (isEditing && updateAction) {
        await updateAction(formData);
      } else {
        await assignAction(formData);
      }

      // Reset form
      setProductId("");
      setQuantity("");
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProductId("");
      setQuantity("");
      setNotes("");
      onClose();
    }
  };

  const productOptions = [
    { value: "", label: "Select a product..." },
    ...availableProducts.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.stockLevel} ${product.unit} available)`,
    })),
  ];

  // For editing, add the current product to options if not in available products
  if (isEditing && editingAssignment) {
    const currentProductInList = availableProducts.find(
      (p) => p.id === editingAssignment.productId
    );
    
    if (!currentProductInList) {
      productOptions.push({
        value: editingAssignment.productId,
        label: `${editingAssignment.product.name} (Currently assigned)`,
      });
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Inventory Assignment" : "Assign Product to Employee"}
      subheader={
        isEditing
          ? "Update the quantity or notes for this product assignment."
          : "Assign products from inventory to this employee."
      }>
      <form onSubmit={handleSubmit} className="space-y-6">
        {isEditing && (
          <input type="hidden" name="assignmentId" value={editingAssignment?.id} />
        )}

        <div className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <label
              htmlFor="productId"
              className="block text-sm font-medium text-gray-900">
              Product <span className="text-red-500">*</span>
            </label>
            <Select
              name="productId"
              value={productId}
              onChange={setProductId}
              required
              options={productOptions}
              variant="default"
              size="md"
              disabled={isEditing} // Don't allow changing product when editing
            />
            {isEditing && (
              <p className="text-xs text-gray-500">
                Product cannot be changed when editing. Remove and create a new assignment to change products.
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-900">
              Quantity <span className="text-red-500">*</span>
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
            {productId && (
              <p className="text-xs text-gray-500">
                Unit:{" "}
                {isEditing
                  ? editingAssignment?.product.unit
                  : availableProducts.find((p) => p.id === productId)?.unit}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-900">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              type="text"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For Route A, Special equipment, etc."
              variant="default"
              size="md"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            variant="ghost"
            size="md">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !productId || !quantity}
            variant="primary"
            size="md">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {isEditing ? "Updating..." : "Assigning..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                {isEditing ? "Update Assignment" : "Assign Product"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

