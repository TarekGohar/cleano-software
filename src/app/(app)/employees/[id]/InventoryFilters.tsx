"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import CustomDropdown from "@/components/ui/custom-dropdown";
import { useInventoryLoading } from "./InventoryLoadingContext";

export function InventoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { setLoading } = useInventoryLoading();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const stockStatus = searchParams.get("stockStatus") || "all";
  const perPage = searchParams.get("perPage") || "10";

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset cursor when filters change
    if (!updates.cursor) {
      params.delete("cursor");
      params.delete("direction");
    }

    // Preserve view
    if (!params.has("view")) {
      params.set("view", "inventory");
    }

    const currentPath = window.location.pathname;
    return `${currentPath}?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentSearch = searchParams.get("search") || "";

    if (search !== currentSearch) {
      setLoading(true);
      startTransition(() => {
        router.push(buildUrl({ search }));
      });
    }
  };

  const handleStockStatusChange = (value: string) => {
    setLoading(true);
    startTransition(() => {
      router.push(buildUrl({ stockStatus: value }));
    });
  };

  const handlePerPageChange = (value: string) => {
    setLoading(true);
    startTransition(() => {
      router.push(buildUrl({ perPage: value }));
    });
  };

  const stockStatusOptions = [
    { value: "all", label: "All Stock" },
    { value: "in-stock", label: "In Stock" },
    { value: "low-stock", label: "Low Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ];

  const perPageOptions = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
  ];

  return (
    <Card variant="ghost">
      <div className="flex items-end gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <label
            htmlFor="search"
            className="block text-sm font-[450] text-gray-700 mb-1.5">
            Search
          </label>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or notes..."
                variant="default"
                size="lg"
                className="pr-10"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Stock Status Filter */}
        <div className="w-48">
          <label
            htmlFor="stockStatus"
            className="block text-sm font-[450] text-gray-700 mb-1.5">
            Stock Status
          </label>
          <CustomDropdown
            trigger={
              <div className="w-full px-3 py-2 border border-gray-300 rounded-2xl bg-white text-sm text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-between cursor-pointer">
                <span>
                  {stockStatusOptions.find((opt) => opt.value === stockStatus)
                    ?.label || "All Stock"}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            }
            options={stockStatusOptions.map((option) => ({
              label: option.label,
              onClick: () => handleStockStatusChange(option.value),
            }))}
            align="left"
            size="md"
          />
        </div>

        {/* Per Page */}
        <div className="w-32">
          <label
            htmlFor="perPage"
            className="block text-sm font-[450] text-gray-700 mb-1.5">
            Per Page
          </label>
          <CustomDropdown
            trigger={
              <div className="w-full px-3 py-2 border border-gray-300 rounded-2xl bg-white text-sm text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-between cursor-pointer">
                <span>
                  {perPageOptions.find((opt) => opt.value === perPage)?.label ||
                    "10"}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            }
            options={perPageOptions.map((option) => ({
              label: option.label,
              onClick: () => handlePerPageChange(option.value),
            }))}
            align="left"
            size="md"
          />
        </div>
      </div>
    </Card>
  );
}
