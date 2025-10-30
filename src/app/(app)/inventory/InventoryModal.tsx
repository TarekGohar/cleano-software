"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import createProduct from "../actions/createProduct";
import { updateProduct } from "../actions/updateProduct";
import { deleteProduct } from "../actions/deleteProduct";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  costPerUnit: number;
  stockLevel: number;
  minStock: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  mode: "create" | "edit";
}

const initialState = {
  message: "",
  error: "",
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant="primary" size="md">
      {pending
        ? mode === "create"
          ? "Creating..."
          : "Updating..."
        : mode === "create"
          ? "Create Product"
          : "Update Product"}
    </Button>
  );
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  mode,
}: ProductModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createAction = async (prevState: any, formData: FormData) => {
    return createProduct(prevState, formData);
  };

  const updateAction = async (prevState: any, formData: FormData) => {
    return updateProduct(product!.id, prevState, formData);
  };

  const [state, formAction] = useFormState(
    mode === "create" ? createAction : updateAction,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    }
  }, [state.message, onClose]);

  // Reset delete confirmation when product changes
  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [product]);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    const result = await deleteProduct(product.id);

    if (result.success) {
      onClose();
      window.location.reload();
    } else {
      alert(result.error || "Failed to delete product");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Product" : "Edit Product"}
      className="max-w-2xl">
      <div className="space-y-4">
        {/* Alerts */}
        {state.error && (
          <Card variant="error">
            <p className="text-sm text-red-700">{state.error}</p>
          </Card>
        )}

        {state.message && (
          <Card variant="alara_light_bordered">
            <p className="text-sm text-green-700">{state.message}</p>
          </Card>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
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
              defaultValue={product?.name || ""}
              placeholder="e.g., All-Purpose Cleaner"
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
              defaultValue={product?.description || ""}
              placeholder="Brief description of the product..."
              variant="default"
              size="md"
              rows={3}
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
                defaultValue={product?.unit || ""}
                placeholder="e.g., bottles, liters, kg"
                variant="default"
                size="md"
              />
            </div>

            <div>
              <label
                htmlFor="costPerUnit"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Cost Per Unit *
              </label>
              <Input
                type="number"
                id="costPerUnit"
                name="costPerUnit"
                required
                step="0.01"
                min="0"
                defaultValue={product?.costPerUnit || ""}
                placeholder="0.00"
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
                Warehouse Stock *
              </label>
              <Input
                type="number"
                id="stockLevel"
                name="stockLevel"
                required
                step="0.01"
                min="0"
                defaultValue={product?.stockLevel || ""}
                placeholder="0"
                variant="default"
                size="md"
              />
            </div>

            <div>
              <label
                htmlFor="minStock"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Minimum Stock Level *
              </label>
              <Input
                type="number"
                id="minStock"
                name="minStock"
                required
                step="0.01"
                min="0"
                defaultValue={product?.minStock || ""}
                placeholder="0"
                variant="default"
                size="md"
              />
              <p className="text-sm text-gray-500 mt-1.5">
                Alert when stock falls below this level
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
            {/* Delete button on the left (only in edit mode) */}
            {mode === "edit" && !showDeleteConfirm && (
              <Button
                variant="ghost"
                size="md"
                submit={false}
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}

            {mode === "edit" && showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Are you sure?</span>
                <Button
                  variant="outline"
                  size="sm"
                  submit={false}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  submit={false}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            )}

            {/* Action buttons on the right */}
            <div className="flex gap-3 ml-auto">
              <Button
                variant="outline"
                size="md"
                submit={false}
                onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton mode={mode} />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

