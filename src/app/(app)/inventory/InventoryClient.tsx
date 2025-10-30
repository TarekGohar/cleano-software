"use client";

import { useState, createContext, useContext } from "react";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { ProductModal } from "./InventoryModal";

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  costPerUnit: number;
  stockLevel: number;
  minStock: number;
}

interface ProductModalContextType {
  openCreateModal: () => void;
  openEditModal: (product: Product) => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(
  undefined
);

export const useProductModal = () => {
  const context = useContext(ProductModalContext);
  if (!context) {
    throw new Error("useProductModal must be used within ProductModalProvider");
  }
  return context;
};

export function ProductModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const openCreateModal = () => {
    setSelectedProduct(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <ProductModalContext.Provider value={{ openCreateModal, openEditModal }}>
      {children}
      <ProductModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        mode={modalMode}
      />
    </ProductModalContext.Provider>
  );
}

export function CreateProductButton() {
  const { openCreateModal } = useProductModal();

  return (
    <Button
      variant="primary"
      size="md"
      submit={false}
      onClick={openCreateModal}>
      <Plus className="w-4 h-4 mr-2" />
      Add Product
    </Button>
  );
}
