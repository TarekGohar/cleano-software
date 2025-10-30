"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Package } from "lucide-react";
import Button from "@/components/ui/Button";

export type ViewType = "overview" | "inventory";

interface ViewToggleProps {
  currentView: ViewType;
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleViewChange = (view: ViewType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "inventory") {
      params.set("view", "inventory");
    } else {
      params.delete("view");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-2xl border border-gray-100 bg-white p-1 gap-2">
      <Button
        onClick={() => handleViewChange("overview")}
        variant={currentView === "overview" ? "primary" : "ghost"}
        submit={false}>
        <BarChart3 className="w-4 h-4 mr-2" />
        Overview
      </Button>
      <Button
        onClick={() => handleViewChange("inventory")}
        variant={currentView === "inventory" ? "primary" : "ghost"}
        submit={false}>
        <Package className="w-4 h-4 mr-2" />
        Inventory
      </Button>
    </div>
  );
}
