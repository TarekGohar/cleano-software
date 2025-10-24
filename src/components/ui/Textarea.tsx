"use client";

import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "minimal" | "ghost" | "outline";
  error?: boolean;
  size?: "sm" | "md" | "lg";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = "default",
      error = false,
      className = "",
      size = "md",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "w-full text-left text-sm transition-all duration-200 text-black rounded-2xl outline-none resize-none";

    const variantClasses = {
      default:
        "border border-[#005F6A]/10 hover:border-[#005F6A]/20 focus:border-[#77C8CC] ",
      minimal:
        "bg-transparent border-0 border-b border-gray-200 rounded-none hover:border-gray-400 focus:border-[#005F6A]/70",
      ghost:
        "bg-transparent border-0 hover:bg-gray-50 focus:bg-white focus:border focus:border-[#005F6A]/70 rounded-md",
      outline:
        "bg-white border border-gray-300 hover:border-gray-400 focus:border-[#005F6A]/70",
    }[variant];

    const errorClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
      : "";

    const sizeClasses = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    }[size];

    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${errorClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
