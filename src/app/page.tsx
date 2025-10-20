import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";

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

          <div className="flex justify-center gap-4 mb-16">
            <Link href="/sign-in">
              <Button variant="primary" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="secondary" size="lg">
                Sign Up
              </Button>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mt-16">
            <FeatureCard
              icon="📦"
              title="Inventory Management"
              description="Track products, stock levels, and costs in real-time"
            />
            <FeatureCard
              icon="🧰"
              title="Kit Assignment"
              description="Create and assign product kits to your cleaning team"
            />
            <FeatureCard
              icon="📊"
              title="Usage Analytics"
              description="Monitor product usage and employee performance"
            />
            <FeatureCard
              icon="💼"
              title="Job Tracking"
              description="Log jobs and track product consumption per client"
            />
            <FeatureCard
              icon="📝"
              title="Request System"
              description="Employees can request inventory when they need it"
            />
            <FeatureCard
              icon="⚡"
              title="Real-time Alerts"
              description="Get notified when stock levels are running low"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
