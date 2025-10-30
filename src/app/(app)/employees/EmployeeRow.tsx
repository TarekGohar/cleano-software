"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CustomDropdown from "@/components/ui/custom-dropdown";
import { ChevronRight, Pencil } from "lucide-react";
import { useEmployeeModal } from "./EmployeesClient";

interface EmployeeRowProps {
  employee: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "OWNER" | "ADMIN" | "EMPLOYEE";
    completedJobsCount: number;
    activeJobsCount: number;
    totalRevenue: number;
    unpaidJobs: number;
  };
}

export function EmployeeRow({ employee }: EmployeeRowProps) {
  const { openEditModal } = useEmployeeModal();

  return (
    <div className="grid grid-cols-8 hover:bg-gray-50/50 transition-colors items-center">
      {/* Name + Unpaid */}
      <div className="px-6 py-4 flex flex-col justify-center">
        <span className="text-sm font-medium text-gray-900">
          {employee.name}
        </span>
        {employee.unpaidJobs > 0 && (
          <span className="text-xs text-orange-600 mt-0.5">
            {employee.unpaidJobs} unpaid job
            {employee.unpaidJobs > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {/* Email */}
      <span className="px-6 py-4 text-sm text-gray-500 flex items-center">
        {employee.email}
      </span>
      {/* Phone */}
      <span className="px-6 py-4 text-sm text-gray-500 flex items-center">
        {employee.phone || "-"}
      </span>
      {/* Role */}
      <span className="px-6 py-4 flex items-center">
        <Badge
          variant={
            employee.role === "OWNER"
              ? "error"
              : employee.role === "ADMIN"
                ? "secondary"
                : "default"
          }
          size="sm">
          {employee.role}
        </Badge>
      </span>
      {/* Completed Jobs */}
      <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
        {employee.completedJobsCount}
      </span>
      {/* Active Jobs */}
      <span className="px-6 py-4 text-sm text-gray-900 flex items-center">
        {employee.activeJobsCount > 0 ? (
          <Badge variant="alara" size="sm">
            {employee.activeJobsCount}
          </Badge>
        ) : (
          <span className="text-gray-400">0</span>
        )}
      </span>
      {/* Total Revenue */}
      <span className="px-6 py-4 text-sm font-medium text-green-600 flex items-center">
        ${employee.totalRevenue.toFixed(2)}
      </span>
      {/* Actions */}
      <span className="px-6 py-4 text-right text-sm flex items-center justify-end gap-2">
        <CustomDropdown
          trigger={
            <Button
              variant="default"
              size="sm"
              submit={false}
              className="text-neutral-500 hover:text-neutral-700">
              Actions
              <ChevronRight size={12} className="ml-1" />
            </Button>
          }
          options={[
            {
              label: "View Details",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ),
              onClick: () => {
                window.location.href = `/employees/${employee.id}`;
              },
            },
            {
              label: "Edit Employee",
              icon: <Pencil className="w-4 h-4" />,
              onClick: () => openEditModal(employee),
            },
          ]}
          align="right"
        />
      </span>
    </div>
  );
}

