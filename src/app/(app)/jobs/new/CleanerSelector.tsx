"use client";

import { useState, useMemo } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CleanerSelectorProps {
  users: User[];
  initialSelectedIds?: string[];
}

export default function CleanerSelector({
  users,
  initialSelectedIds = [],
}: CleanerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCleaners, setSelectedCleaners] = useState<User[]>(() => {
    // Initialize with users that match the initialSelectedIds
    return users.filter((user) => initialSelectedIds.includes(user.id));
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
    );
  }, [searchTerm, users]);

  // Get users that haven't been selected yet
  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedCleaners.map((c) => c.id));
    return filteredUsers.filter((user) => !selectedIds.has(user.id));
  }, [filteredUsers, selectedCleaners]);

  const handleSelectCleaner = (user: User) => {
    // Check if already selected (extra safety)
    if (!selectedCleaners.find((c) => c.id === user.id)) {
      setSelectedCleaners([...selectedCleaners, user]);
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleRemoveCleaner = (userId: string) => {
    setSelectedCleaners(selectedCleaners.filter((c) => c.id !== userId));
  };

  return (
    <div>
      <label
        htmlFor="cleaner-search"
        className="block text-sm font-medium text-gray-700 mb-1">
        Cleaner(s)
      </label>

      {/* Search Input */}
      <div className="relative">
        <Input
          id="cleaner-search"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder="Search by name or email..."
        />

        {/* Dropdown */}
        {isDropdownOpen && availableUsers.length > 0 && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectCleaner(user)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* No results message */}
        {isDropdownOpen &&
          searchTerm &&
          availableUsers.length === 0 &&
          filteredUsers.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
              No users found matching &quot;{searchTerm}&quot;
            </div>
          )}
      </div>

      {/* Selected Cleaners List */}
      {selectedCleaners.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Selected Cleaners ({selectedCleaners.length})
          </p>
          <div className="space-y-2">
            {selectedCleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className="flex items-center justify-between rounded-lg px-4 py-2"
                style={{
                  backgroundColor: "#E6F4F5",
                  borderColor: "#77C8CC",
                  borderWidth: "1px",
                }}>
                <div>
                  <div className="font-medium text-gray-900">
                    {cleaner.name}
                  </div>
                  <div className="text-sm text-gray-600">{cleaner.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCleaner(cleaner.id)}
                  className="ml-4 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                  aria-label={`Remove ${cleaner.name}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {selectedCleaners.map((cleaner) => (
        <input
          key={cleaner.id}
          type="hidden"
          name="cleaners"
          value={cleaner.id}
        />
      ))}

      {selectedCleaners.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Search and select cleaners to add them to this job
        </p>
      )}
    </div>
  );
}
