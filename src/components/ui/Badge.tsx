"use client";

import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "tdo"
    | "alara"
    | "destructive"
    | "dentitek"
    | "pro";
  size?: "xs" | "sm" | "md";
}

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  ...props
}: BadgeProps) {
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xxs",
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  }[size];

  const variantClasses = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-50 text-red-700",
    tdo: "bg-purple-100 text-purple-700",
    secondary: "bg-[#77C8CC]/20 text-[#77C8CC] hover:bg-[#77C8CC]/50",
    alara: "bg-[#005F6A]/20 text-[#005F6A] hover:bg-[#005F6A]/50",
    destructive: "bg-red-100 text-red-700",
    dentitek:
      "bg-[#173f38]/85 text-white hover:bg-[#173f38]/95 border-[#173f38]/20",
    pro: "bg-[#b788bf]/40 text-[#59385e] hover:bg-[#b788bf]/50 border-[#b788bf]/20",
  }[variant];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md font-[450] ${sizeClasses} ${variantClasses} ${className}`}
      {...props}>
      {children}
    </div>
  );
}
