import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome back, {user.name}!</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(user.role === "OWNER" || user.role === "ADMIN") && (
          <>
            <DashboardCard
              title="Total Products"
              description="Manage your inventory"
              href="/dashboard/products"
            />
            <DashboardCard
              title="Kits"
              description="Create and manage kits"
              href="/dashboard/kits"
            />
            <DashboardCard
              title="Employees"
              description="Manage employees and assignments"
              href="/dashboard/employees"
            />
            <DashboardCard
              title="Requests"
              description="Review inventory requests"
              href="/dashboard/requests"
            />
            <DashboardCard
              title="Analytics"
              description="View usage reports"
              href="/dashboard/analytics"
            />
          </>
        )}

        <DashboardCard
          title="My Jobs"
          description="Log and track your jobs"
          href="/dashboard/jobs"
        />
        <DashboardCard
          title="Request Inventory"
          description="Request products or kits"
          href="/dashboard/my-requests"
        />
        <DashboardCard
          title="My Kits"
          description="View your assigned kits"
          href="/dashboard/my-kits"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </a>
  );
}
