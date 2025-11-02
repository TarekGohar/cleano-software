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
          ? "bg-neutral-950/10 text-neutral-950"
          : "border-transparent text-neutral-950/70 hover:text-neutral-950 hover:bg-neutral-950/5"
      }`}>
      {children}
    </Link>
  );
}
