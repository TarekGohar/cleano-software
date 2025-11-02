import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import signOut from "./actions/signOut";
import NavLink from "./NavLink";
import Image from "next/image";
import InitialsDropdown from "@/components/ui/InitialsDropdown";

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
    <div className="min-h-screen bg-white">
      <nav className="">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href=""
                className="w-[10rem] flex items-center px-2 text-xl font-[450] text-gray-900">
                <Image
                  src="/images/logo.svg"
                  alt="Cleano"
                  width={1000}
                  height={1000}
                />
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-0">
                <NavLink href="/dashboard">Dashboard</NavLink>
                {isAdmin && (
                  <>
                    <NavLink href="/analytics">Analytics</NavLink>
                    <NavLink href="/employees">Employees</NavLink>
                    <NavLink href="/inventory">Inventory</NavLink>

                    <NavLink href="/jobs">Jobs</NavLink>
                  </>
                )}
                <NavLink href="/my-jobs">My Jobs</NavLink>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <InitialsDropdown
                userName={userWithRole.name}
                signOutAction={signOut}
              />
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
