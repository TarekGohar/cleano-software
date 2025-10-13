import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Cleano Business Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your cleaning business operations with our comprehensive
            inventory tracking system
          </p>

          <div className="flex justify-center space-x-4 mb-16">
            <Link
              href="/sign-in"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              Sign Up
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mt-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">
                Inventory Management
              </h3>
              <p className="text-gray-600">
                Track products, stock levels, and costs in real-time
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">🧰</div>
              <h3 className="text-xl font-semibold mb-2">Kit Assignment</h3>
              <p className="text-gray-600">
                Create and assign product kits to your cleaning team
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Usage Analytics</h3>
              <p className="text-gray-600">
                Monitor product usage and employee performance
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-2">Job Tracking</h3>
              <p className="text-gray-600">
                Log jobs and track product consumption per client
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Request System</h3>
              <p className="text-gray-600">
                Employees can request inventory when they need it
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Alerts</h3>
              <p className="text-gray-600">
                Get notified when stock levels are running low
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
