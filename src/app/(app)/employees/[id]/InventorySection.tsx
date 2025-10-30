"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import InventoryModal from "./InventoryModal";
import InventoryItem from "./InventoryItem";
import { Package, Plus } from "lucide-react";

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

interface InventorySectionProps {
  assignedProducts: Assignment[];
  availableProducts: Product[];
  assignAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
}

export default function InventorySection({
  assignedProducts,
  availableProducts,
  assignAction,
  updateAction,
  removeAction,
}: InventorySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );

  const handleOpenModal = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
  };

  return (
    <>
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-[#005F6A]" />
              <h2 className="text-xl font-semibold text-gray-900">
                Assigned Inventory
              </h2>
              {assignedProducts.length > 0 && (
                <Badge variant="alara" size="sm">
                  {assignedProducts.length}{" "}
                  {assignedProducts.length === 1 ? "Item" : "Items"}
                </Badge>
              )}
            </div>
            <Button
              onClick={handleOpenModal}
              variant="primary"
              size="md"
              submit={false}>
              <Plus className="w-4 h-4 mr-2" />
              Assign Inventory
            </Button>
          </div>

          {/* Inventory List/Table */}
          {assignedProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">
                No products assigned yet.
              </p>
              <Button
                onClick={handleOpenModal}
                variant="default"
                size="sm"
                submit={false}>
                <Plus className="w-4 h-4 mr-2" />
                Assign First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg ">
              <div className="overflow-x-auto">
                {/* Header row */}
                <div className="grid grid-cols-5 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="px-6 py-3 text-left">Product Name</span>
                  <span className="px-6 py-3 text-left">Quantity</span>
                  <span className="px-6 py-3 text-left col-span-2">Notes</span>
                  <span className="px-6 py-3 text-right">Actions</span>
                </div>
                {/* Products */}
                <div className="bg-white divide-y divide-gray-200">
                  {assignedProducts.map((assignment) => (
                    <InventoryItem
                      key={assignment.id}
                      assignment={assignment}
                      removeAction={removeAction}
                      onEdit={() => handleEditAssignment(assignment)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        availableProducts={availableProducts}
        assignAction={assignAction}
        updateAction={updateAction}
        editingAssignment={editingAssignment}
      />
    </>
  );
}
