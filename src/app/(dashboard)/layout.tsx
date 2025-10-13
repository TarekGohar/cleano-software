import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;
  const isAdmin = user.role === "OWNER" || user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/dashboard"
                className="flex items-center px-2 text-xl font-bold text-gray-900">
                Cleano
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/dashboard">Dashboard</NavLink>
                {isAdmin && (
                  <>
                    <NavLink href="/dashboard/products">Products</NavLink>
                    <NavLink href="/dashboard/kits">Kits</NavLink>
                    <NavLink href="/dashboard/employees">Employees</NavLink>
                    <NavLink href="/dashboard/requests">Requests</NavLink>
                    <NavLink href="/dashboard/analytics">Analytics</NavLink>
                  </>
                )}
                <NavLink href="/dashboard/jobs">My Jobs</NavLink>
                <NavLink href="/dashboard/my-kits">My Kits</NavLink>
                <NavLink href="/dashboard/my-requests">My Requests</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {user.role}
              </span>
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="text-sm text-gray-700 hover:text-gray-900">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
      {children}
    </Link>
  );
}
