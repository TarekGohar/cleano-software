"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import CustomDropdown from "@/components/ui/custom-dropdown";
import Button from "@/components/ui/Button";
import { useProductLoading } from "./ProductLoadingContext";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { setLoading } = useProductLoading();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const status = searchParams.get("status") || "all";
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

    return `/inventory?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentSearch = searchParams.get("search") || "";

    // Only trigger navigation if search actually changed
    if (search !== currentSearch) {
      setLoading(true);
      startTransition(() => {
        router.push(buildUrl({ search }));
      });
    }
  };

  const handleStatusChange = (value: string) => {
    setLoading(true);
    startTransition(() => {
      router.push(buildUrl({ status: value }));
    });
  };

  const handlePerPageChange = (value: string) => {
    setLoading(true);
    startTransition(() => {
      router.push(buildUrl({ perPage: value }));
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setLoading(true);
    startTransition(() => {
      router.push("/inventory");
    });
  };

  const hasActiveFilters = search || status !== "all";

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
      <div className="flex items-end gap-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
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
        <div className="w-40">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <CustomDropdown
            trigger={
              <Button
                variant="outline"
                size="md"
                submit={false}
                className="w-full flex items-center !justify-between bg-white">
                <span>
                  {statusOptions.find((opt) => opt.value === status)?.label}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
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
              </Button>
            }
            options={statusOptions.map((opt) => ({
              label: opt.label,
              onClick: () => handleStatusChange(opt.value),
            }))}
            variant="default"
            size="md"
          />
        </div>

        {/* Per Page */}
        <div className="w-32">
          <label
            htmlFor="perPage"
            className="block text-sm font-medium text-gray-700 mb-1.5">
            Per Page
          </label>
          <CustomDropdown
            trigger={
              <Button
                variant="outline"
                size="md"
                submit={false}
                className="w-full flex items-center !justify-between bg-white">
                <span>
                  {perPageOptions.find((opt) => opt.value === perPage)?.label}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
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
              </Button>
            }
            options={perPageOptions.map((opt) => ({
              label: opt.label,
              onClick: () => handlePerPageChange(opt.value),
            }))}
            variant="default"
            size="md"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="pb-[2px]">
            <Button
              onClick={handleClearFilters}
              disabled={isPending}
              variant="outline"
              size="md"
              submit={false}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
