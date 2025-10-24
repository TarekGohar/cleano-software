"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import createEmployee from "../../actions/createEmployee";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

const initialState = {
  message: "",
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} variant="primary" size="md">
      {pending ? "Creating..." : "Create Employee"}
    </Button>
  );
}

export default function NewEmployeePage() {
  const [state, formAction] = useFormState(createEmployee, initialState);

  useEffect(() => {
    if (state.message) {
      // Show success message briefly before redirect
      setTimeout(() => {
        window.location.href = "/employees";
      }, 1000);
    }
  }, [state.message]);

  const roleOptions = [
    { value: "EMPLOYEE", label: "Employee" },
    { value: "ADMIN", label: "Admin" },
    { value: "OWNER", label: "Owner" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <Card variant="default">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            href="/employees"
            submit={false}
            className="!px-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Employees
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Employee
          </h1>
        </div>
      </Card>

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
      <Card variant="default">
        <form action={formAction} className="space-y-6">
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
              placeholder="(555) 123-4567"
              variant="default"
              size="md"
            />
          </div>

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

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1.5">
              Role *
            </label>
            <Select
              id="role"
              name="role"
              required
              value="EMPLOYEE"
              options={roleOptions}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" size="md" href="/employees">
              Cancel
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Card>
    </div>
  );
}

