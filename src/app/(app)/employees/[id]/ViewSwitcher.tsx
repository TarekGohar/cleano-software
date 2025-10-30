"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { InventoryViewSkeleton } from "./InventoryViewSkeleton";
import {
  MetricCardSkeleton,
  JobCardSkeleton,
  ProductListSkeleton,
} from "./LoadingSkeleton";

interface ViewSwitcherProps {
  currentView: "overview" | "inventory";
  overviewContent: React.ReactNode;
  inventoryContent: React.ReactNode;
}

export function ViewSwitcher({
  currentView,
  overviewContent,
  inventoryContent,
}: ViewSwitcherProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [lastView, setLastView] = useState<string | null>(null);

  // Initialize with current view
  useEffect(() => {
    if (lastView === null) {
      setLastView(currentView);
    }
  }, [currentView, lastView]);

  // Detect view changes and show loading immediately
  useEffect(() => {
    const viewParam = searchParams.get("view") || "overview";
    const newView = viewParam === "inventory" ? "inventory" : "overview";

    // If view changed, show loading
    if (lastView !== null && newView !== lastView) {
      setIsLoading(true);
      
      // Keep loading for smooth transition
      const timer = setTimeout(() => {
        setLastView(newView);
        setIsLoading(false);
      }, 400);

      return () => clearTimeout(timer);
    } else if (lastView !== null && newView === lastView && isLoading) {
      // If we're already on the right view, turn off loading
      setIsLoading(false);
    }
  }, [searchParams, lastView, isLoading]);

  // Show skeleton loader during transition
  if (isLoading && lastView !== null) {
    const targetView = searchParams.get("view") || "overview";
    return targetView === "inventory" ? (
      <InventoryViewSkeleton />
    ) : (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
        <ProductListSkeleton />
      </div>
    );
  }

  return <>{currentView === "overview" ? overviewContent : inventoryContent}</>;
}

