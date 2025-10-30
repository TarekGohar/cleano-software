"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import createEmployee from "../actions/createEmployee";
import { updateEmployee } from "../actions/updateEmployee";
import { deleteEmployee } from "../actions/deleteEmployee";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import CustomDropdown from "@/components/ui/custom-dropdown";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Trash2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  mode: "create" | "edit";
}

const initialState = {
  message: "",
  error: "",
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant="primary" size="md">
      {pending
        ? mode === "create"
          ? "Creating..."
          : "Updating..."
        : mode === "create"
          ? "Create Employee"
          : "Update Employee"}
    </Button>
  );
}

export function EmployeeModal({
  isOpen,
  onClose,
  employee,
  mode,
}: EmployeeModalProps) {
  const [selectedRole, setSelectedRole] = useState(
    employee?.role || "EMPLOYEE"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createAction = async (prevState: any, formData: FormData) => {
    formData.set("role", selectedRole);
    return createEmployee(prevState, formData);
  };

  const updateAction = async (prevState: any, formData: FormData) => {
    formData.set("role", selectedRole);
    return updateEmployee(employee!.id, prevState, formData);
  };

  const [state, formAction] = useFormState(
    mode === "create" ? createAction : updateAction,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    }
  }, [state.message, onClose]);

  // Reset role when employee changes
  useEffect(() => {
    setSelectedRole(employee?.role || "EMPLOYEE");
    setShowDeleteConfirm(false);
  }, [employee]);

  const handleDelete = async () => {
    if (!employee) return;

    setIsDeleting(true);
    const result = await deleteEmployee(employee.id);

    if (result.success) {
      onClose();
      window.location.reload();
    } else {
      alert(result.error || "Failed to delete employee");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const roleOptions = [
    { value: "EMPLOYEE", label: "Employee" },
    { value: "ADMIN", label: "Admin" },
    { value: "OWNER", label: "Owner" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Employee" : "Edit Employee"}
      className="max-w-2xl">
      <div className="space-y-4">
        {/* Alerts */}
        {state.error && (
          <Card variant="error">
            <p className="text-sm text-red-700">{state.error}</p>
          </Card>
        )}

        {state.message && (
          <Card variant="alara_light_bordered">
            <p className="text-sm text-green-700">{state.message}</p>
          </Card>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={employee?.name || ""}
              placeholder="John Doe"
              variant="default"
              size="md"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address *
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              required
              defaultValue={employee?.email || ""}
              placeholder="john@example.com"
              variant="default"
              size="md"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={employee?.phone || ""}
              placeholder="(555) 123-4567"
              variant="default"
              size="md"
            />
          </div>

          {mode === "create" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5">
                Password *
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                variant="default"
                size="md"
              />
              <p className="text-sm text-gray-500 mt-1.5">
                This will be their initial password. They can change it later.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Role *
            </label>
            <CustomDropdown
              trigger={
                <Button
                  variant="outline"
                  size="md"
                  submit={false}
                  className="w-full flex items-center !justify-between bg-white">
                  <span>
                    {roleOptions.find((opt) => opt.value === selectedRole)
                      ?.label}
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
              options={roleOptions.map((opt) => ({
                label: opt.label,
                onClick: () => setSelectedRole(opt.value as any),
              }))}
              variant="default"
              size="md"
            />
            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
              <p>
                <strong>Employee:</strong> Can log jobs and request inventory.
              </p>
              <p>
                <strong>Admin:</strong> Can manage everything.
              </p>
              <p>
                <strong>Owner:</strong> Full access to all features.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100">
            {/* Delete button on the left (only in edit mode) */}
            {mode === "edit" && !showDeleteConfirm && (
              <Button
                variant="ghost"
                size="md"
                submit={false}
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}

            {mode === "edit" && showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Are you sure?</span>
                <Button
                  variant="outline"
                  size="sm"
                  submit={false}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  submit={false}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            )}

            {/* Action buttons on the right */}
            <div className="flex gap-3 ml-auto">
              <Button
                variant="outline"
                size="md"
                submit={false}
                onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton mode={mode} />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

