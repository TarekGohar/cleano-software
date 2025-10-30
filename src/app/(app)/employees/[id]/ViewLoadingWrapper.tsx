"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface ViewLoadingWrapperProps {
  children: React.ReactNode;
  currentView: "overview" | "inventory";
}

export function ViewLoadingWrapper({
  children,
  currentView,
}: ViewLoadingWrapperProps) {
  const searchParams = useSearchParams();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevView, setPrevView] = useState(currentView);

  useEffect(() => {
    const viewParam = searchParams.get("view") || "overview";
    const newView = viewParam === "inventory" ? "inventory" : "overview";

    if (newView !== prevView) {
      setIsTransitioning(true);
      setPrevView(newView);

      // Clear transition after content has time to load
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchParams, prevView]);

  return (
    <div className={`transition-opacity duration-200 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
      {children}
    </div>
  );
}

