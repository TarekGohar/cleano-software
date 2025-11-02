"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CustomDropdown from "@/components/ui/custom-dropdown";
import { ChevronRight, Eye, Pencil } from "lucide-react";
import { useProductModal } from "./InventoryClient";

interface ProductRowProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    costPerUnit: number;
    stockLevel: number;
    minStock: number;
    totalAssigned: number;
    employeeCount: number;
    isLowStock: boolean;
  };
}

export function ProductRow({ product }: ProductRowProps) {
  const { openEditModal } = useProductModal();

  return (
    <div className="grid grid-cols-7 hover:bg-gray-50/50 transition-colors items-center">
      {/* Name + Low Stock Warning */}
      <div className="px-6 py-4 flex flex-col justify-center">
        <span className="text-sm font-[450] text-gray-900">{product.name}</span>
      </div>
      {/* Description */}
      <span className="px-6 py-4 text-sm text-gray-500 flex items-center">
        {product.description || "-"}
      </span>
      {/* Stock Level */}
      <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
        {product.stockLevel} {product.unit}
      </span>
      {/* Assigned */}
      <span className="px-6 py-4 text-sm flex items-center">
        {product.totalAssigned > 0 ? (
          <Badge variant="alara" size="sm">
            {product.totalAssigned} {product.unit}
          </Badge>
        ) : (
          <span className="text-gray-400">0</span>
        )}
      </span>
      {/* Employee Count */}
      <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
        {product.employeeCount > 0 ? (
          <span className="text-[#005F6A] font-[450]">
            {product.employeeCount}
          </span>
        ) : (
          <span className="text-gray-400">0</span>
        )}
      </span>
      {/* Status */}
      <span className="px-6 py-4 flex items-center">
        {product.isLowStock ? (
          <Badge variant="error" size="sm">
            Low Stock
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            In Stock
          </Badge>
        )}
      </span>
      {/* Actions */}
      <span className="px-6 py-4 text-right text-sm flex items-center justify-end gap-2">
        <Button
          variant="default"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700"
          onClick={() => openEditModal(product)}>
          <Pencil className="w-3 h-3 mr-2" />
          Edit
        </Button>
        <Button
          variant="primary"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700"
          onClick={() => (window.location.href = `/inventory/${product.id}`)}>
          <Eye className="w-3 h-3 mr-2" />
          View
        </Button>
      </span>
    </div>
  );
}
