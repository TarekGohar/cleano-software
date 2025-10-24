"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface CustomDropdownProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost";
  trigger: React.ReactNode;
  options: DropdownOption[];
  className?: string;
  maxHeight?: string;
  /** Horizontal alignment of the dropdown relative to the trigger */
  align?: "left" | "right" | "center";
  /** Vertical position of the dropdown relative to the trigger */
  position?: "bottom" | "top";
  /** Distance in pixels between the trigger and dropdown */
  offset?: number;
}

export default function CustomDropdown({
  size = "sm",
  variant = "default",
  trigger,
  options,
  className = "",
  maxHeight = "12rem",
  align = "left",
  position = "bottom",
  offset = 4,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update dropdown position based on trigger position
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      // Calculate vertical position
      const top =
        position === "top"
          ? rect.top + window.scrollY - offset
          : rect.bottom + window.scrollY + offset;

      // Calculate horizontal position based on alignment
      let left = rect.left + window.scrollX;
      if (align === "right") {
        left = rect.right + window.scrollX;
      } else if (align === "center") {
        left = rect.left + window.scrollX + rect.width / 2;
      }

      setDropdownPosition({
        top,
        left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();

      // Update position on scroll and resize
      const handleScrollOrResize = () => {
        updateDropdownPosition();
      };

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, align, position, offset]);

  const handleOptionClick = (option: DropdownOption) => {
    option.onClick();
    setIsOpen(false);
  };

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed min-w-40 bg-white border border-gray-200 rounded-2xl !overflow-hidden shadow-lg z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: align === "left" ? `${dropdownPosition.width}px` : undefined,
        minWidth: align !== "left" ? `${dropdownPosition.width}px` : undefined,
        transform:
          `${position === "top" ? "translateY(-100%)" : ""} ${
            align === "right"
              ? "translateX(-100%)"
              : align === "center"
                ? "translateX(-50%)"
                : ""
          }`.trim() || "none",
        transformOrigin: position === "top" ? "bottom" : "top",
      }}>
      <div className="py-1 overflow-y-auto " style={{ maxHeight }}>
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors">
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer">
        {trigger}
      </div>
      {typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
}
