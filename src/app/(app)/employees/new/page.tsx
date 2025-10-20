"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import createEmployee from "../../actions/createEmployee";

const initialState = {
  message: "",
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? "Creating..." : "Create Employee"}
    </button>
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Employee</h1>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}

      {state.message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{state.message}</p>
        </div>
      )}

      <form
        action={formAction}
        className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimum 8 characters"
          />
          <p className="text-sm text-gray-500 mt-1">
            This will be their initial password. They can change it later.
          </p>
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="EMPLOYEE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
            <option value="OWNER">Owner</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            <strong>Employee:</strong> Can log jobs and request inventory.
            <br />
            <strong>Admin:</strong> Can manage everything.
            <br />
            <strong>Owner:</strong> Full access to all features.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <a
            href="/employees"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </a>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
