"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const status = searchParams.get("status") || "all";
  const perPage = searchParams.get("perPage") || "10";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!updates.page) {
      params.set("page", "1");
    }

    return `/products?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => {
      router.push(buildUrl({ search, page: "1" }));
    });
  };

  const handleStatusChange = (value: string) => {
    startTransition(() => {
      router.push(buildUrl({ status: value, page: "1" }));
    });
  };

  const handlePerPageChange = (value: string) => {
    startTransition(() => {
      router.push(buildUrl({ perPage: value, page: "1" }));
    });
  };

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder =
      sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc";
    startTransition(() => {
      router.push(
        buildUrl({ sortBy: newSortBy, sortOrder: newSortOrder, page: "1" })
      );
    });
  };

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "in-stock", label: "In Stock" },
    { value: "low-stock", label: "Low Stock" },
  ];

  const perPageOptions = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
  ];

  return (
    <Card variant="default">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Search
            </label>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or description..."
                  variant="default"
                  size="md"
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

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <Select
              id="status"
              value={status}
              onChange={handleStatusChange}
              disabled={isPending}
              options={statusOptions}
              variant="default"
              size="md"
            />
          </div>

          {/* Per Page */}
          <div>
            <label
              htmlFor="perPage"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Per Page
            </label>
            <Select
              id="perPage"
              value={perPage}
              onChange={handlePerPageChange}
              disabled={isPending}
              options={perPageOptions}
              variant="default"
              size="md"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <Button
            onClick={() => handleSortChange("name")}
            disabled={isPending}
            variant={sortBy === "name" ? "primary" : "default"}
            size="sm"
            submit={false}>
            Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            onClick={() => handleSortChange("stockLevel")}
            disabled={isPending}
            variant={sortBy === "stockLevel" ? "primary" : "default"}
            size="sm"
            submit={false}>
            Stock {sortBy === "stockLevel" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            onClick={() => handleSortChange("costPerUnit")}
            disabled={isPending}
            variant={sortBy === "costPerUnit" ? "primary" : "default"}
            size="sm"
            submit={false}>
            Cost {sortBy === "costPerUnit" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            onClick={() => handleSortChange("createdAt")}
            disabled={isPending}
            variant={sortBy === "createdAt" ? "primary" : "default"}
            size="sm"
            submit={false}>
            Date {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
          </Button>

          {isPending && (
            <div className="ml-2 flex items-center gap-1.5 text-sm text-[#005F6A]">
              <svg
                className="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
