import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import signOut from "./actions/signOut";
import NavLink from "./NavLink";
import Image from "next/image";
import UserActions from "./UserActions";

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
  const userWithRole = user as typeof user & {
    role: "OWNER" | "ADMIN" | "EMPLOYEE";
  };
  const isAdmin =
    userWithRole.role === "OWNER" || userWithRole.role === "ADMIN";

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar - Icon Only */}
      <aside className="w-20 bg-white border-r border-[#005F6A]/10 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-[#005F6A]/10">
          <Link href="/dashboard" className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-[#005F6A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <NavLink href="/dashboard" icon="dashboard" iconOnly>
            Dashboard
          </NavLink>
          {isAdmin && (
            <>
              <NavLink href="/analytics" icon="analytics" iconOnly>
                Analytics
              </NavLink>
              <NavLink href="/employees" icon="employees" iconOnly>
                Employees
              </NavLink>
              <NavLink href="/inventory" icon="inventory" iconOnly>
                Inventory
              </NavLink>
              <NavLink href="/jobs" icon="jobs" iconOnly>
                Jobs
              </NavLink>
            </>
          )}
          <NavLink href="/my-jobs" icon="my-jobs" iconOnly>
            My Jobs
          </NavLink>
          <NavLink href="/calendar" icon="calendar" iconOnly>
            Calendar
          </NavLink>
        </nav>

        {/* User Section */}
        <div className="border-t border-[#005F6A]/10 p-4 flex justify-center">
          <UserActions user={userWithRole} signOutAction={signOut} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-20 h-screen overflow-hidden">
        <main className="h-full bg-white overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
