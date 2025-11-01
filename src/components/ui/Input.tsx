"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?:
    | "default"
    | "minimal"
    | "badge"
    | "ghost"
    | "outline"
    | "search"
    | "compact"
    | "large";
  error?: boolean;
  size?: "sm" | "md" | "lg" | undefined;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
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
      "w-full text-left transition-all duration-200 text-black !rounded-2xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    const variantClasses = {
      default:
        "border border-[#005F6A]/10 rounded-md hover:border-[#005F6A]/20 focus:border-[#77C8CC] ",
      minimal:
        "bg-transparent border-0 border-b border-gray-200 rounded-none hover:border-gray-400 focus:border-[#005F6A]/70",
      badge:
        "font-[450] bg-white border border-gray-200 rounded-md hover:border-gray-300 focus:border-[#005F6A]/70",
      search:
        "pl-3 border border-[#005F6A]/10 hover:border-[#005F6A]/20 focus:border-[#77C8CC]",
      compact:
        "border border-gray-200 rounded-sm hover:border-gray-300 focus:border-[#005F6A]/70",
      large:
        "border border-gray-200 rounded-2xl hover:border-gray-300 focus:border-[#005F6A]/70",
      ghost:
        "bg-transparent border-0 hover:bg-gray-50 focus:bg-white focus:border focus:border-[#005F6A]/70 rounded-md",
      outline:
        "bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:border-[#005F6A]/70",
    }[variant];

    const errorClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
      : "";

    const sizeClasses = {
      sm: "px-2 py-1 text-xs",
      md: "px-2 py-1.5 text-sm",
      lg: "px-2 py-1.5 text-md",
    }[size];

    return (
      <input
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${errorClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
