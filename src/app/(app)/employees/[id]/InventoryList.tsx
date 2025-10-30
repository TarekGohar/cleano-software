"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";
import InventoryItem from "./InventoryItem";
import InventoryModal from "./InventoryModal";
import { InventoryTableHeader } from "./InventoryTableHeader";
import { InventoryLoadingOverlay } from "./InventoryLoadingOverlay";

interface Assignment {
  id: string;
  productId: string;
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
}

interface Product {
  id: string;
  name: string;
  stockLevel: number;
  unit: string;
}

interface InventoryListProps {
  paginatedProducts: Assignment[];
  placeholderRowCount: number;
  minDisplayRows: number;
  search: string;
  stockStatus: string;
  availableProducts: Product[];
  assignAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  removeAction: (formData: FormData) => Promise<void>;
}

export function InventoryList({
  paginatedProducts,
  placeholderRowCount,
  minDisplayRows,
  search,
  stockStatus,
  availableProducts,
  assignAction,
  updateAction,
  removeAction,
}: InventoryListProps) {
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
      <div className="overflow-hidden rounded-lg relative">
        <InventoryLoadingOverlay />

        {/* Add Inventory Button */}
        <div className="px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Inventory Items
          </h3>
          <Button onClick={handleOpenModal} variant="primary" submit={false}>
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory
          </Button>
        </div>

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="grid grid-cols-6 bg-gray-50/50">
            <InventoryTableHeader label="Product Name" sortKey="name" />
            <InventoryTableHeader label="Quantity" sortKey="quantity" />
            <InventoryTableHeader label="Value" sortKey="value" />
            <InventoryTableHeader label="Assigned" sortKey="assignedAt" />
            <span className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
              Notes
            </span>
            <span className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end">
              Actions
            </span>
          </div>

          {/* Inventory Items */}
          <div className="bg-white divide-y divide-gray-50">
            {paginatedProducts.length === 0 ? (
              <>
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                  {search || stockStatus !== "all"
                    ? "No inventory items found matching your filters."
                    : "No inventory items assigned."}
                </div>
                {Array.from({ length: minDisplayRows - 1 }).map((_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="grid grid-cols-6 h-16">
                    {Array.from({ length: 6 }).map((_, colIdx) => (
                      <div key={colIdx} className="px-6 py-4"></div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <>
                {paginatedProducts.map((assignment) => (
                  <InventoryItem
                    key={assignment.id}
                    assignment={assignment}
                    removeAction={removeAction}
                    onEdit={() => handleEditAssignment(assignment)}
                    useFullWidth={false}
                  />
                ))}
                {placeholderRowCount > 0 &&
                  Array.from({ length: placeholderRowCount }).map((_, idx) => (
                    <div
                      key={`placeholder-${idx}`}
                      className="grid grid-cols-6 h-16">
                      {Array.from({ length: 6 }).map((_, colIdx) => (
                        <div key={colIdx} className="px-6 py-4"></div>
                      ))}
                    </div>
                  ))}
              </>
            )}
          </div>
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
