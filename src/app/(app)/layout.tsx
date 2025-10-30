import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import signOut from "./actions/signOut";
import NavLink from "./NavLink";

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
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-10">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href=""
                className="flex items-center px-2 text-xl font-bold text-gray-900">
                Cleano
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/dashboard">Dashboard</NavLink>
                {isAdmin && (
                  <>
                    <NavLink href="/inventory">Inventory</NavLink>
                    <NavLink href="/employees">Employees</NavLink>
                    <NavLink href="/analytics">Analytics</NavLink>
                  </>
                )}
                <NavLink href="/jobs">Jobs</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {user.role}
              </span>
              <form action={signOut}>
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
      <main className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black">
        {children}
      </main>
    </div>
  );
}
