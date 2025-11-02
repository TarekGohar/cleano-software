"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`inline-flex items-center px-4 pt-1 border-b-2 text-sm font-[450] transition-colors ${
        isActive
          ? "bg-[#005F6A]/10 text-[#005F6A]"
          : "border-transparent text-[#005F6A]/70 hover:text-[#005F6A] hover:bg-[#005F6A]/5"
      }`}>
      {children}
    </Link>
  );
}
