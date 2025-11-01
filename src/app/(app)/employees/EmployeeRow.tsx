"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CustomDropdown from "@/components/ui/custom-dropdown";
import { ChevronRight, Eye, Pencil } from "lucide-react";
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
        <span className="text-sm font-[450] text-gray-900">
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
      <span className="px-6 py-4 text-sm font-[450] text-green-600 flex items-center">
        ${employee.totalRevenue.toFixed(2)}
      </span>
      {/* Actions */}
      <span className="px-6 py-4 text-right text-sm flex items-center justify-end gap-2">
        <Button
          variant="default"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700"
          onClick={() => openEditModal(employee)}>
          <Pencil className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="primary"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700"
          href={`/employees/${employee.id}`}>
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </span>
    </div>
  );
}
