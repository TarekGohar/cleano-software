import type { Metadata } from "next";
import "./globals.css";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Cleano Software",
  description: "Cleano Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
