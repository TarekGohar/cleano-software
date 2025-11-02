"use client";

import React, { memo, useMemo } from "react";

interface DecorativeCircle {
  color: string;
  size: string;
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  blur?: string;
  opacity?: string;
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "minimal"
    | "elevated"
    | "recorder"
    | "alara_light"
    | "alara_light_bordered_high"
    | "alara_light_bordered"
    | "alara_dark"
    | "error"
    | "ghost"
    | "warning"
    | "alert"
    | "alara_dark_solid"
    | "glassy"
    | "glassy_dark"
    | "glassy_high";
  decorativeCircles?: DecorativeCircle[];
  /**
   * Use CSS-only decorative circles for better performance.
   * Predefined patterns that are optimized for GPU acceleration.
   */
}

// Move variant classes outside component to avoid recreation on every render
const VARIANT_CLASSES = {
  default: "bg-[#fafafa]/60",
  minimal: "bg-gray-50/50 border border-gray-100",
  elevated: "bg-white border border-gray-200 shadow-lg",
  recorder: "bg-red-100 border border-red-200",
  alara_light: "bg-neutral-950/10 text-neutral-950 hover:bg-neutral-950/15",
  alara_light_bordered_high: "bg-neutral-950/10 border border-neutral-950/20",
  alara_light_bordered: "bg-neutral-950/7 border border-neutral-950/7",
  alara_dark: "bg-neutral-950/10 text-neutral-950 hover:bg-neutral-950/30",
  alara_dark_solid: "bg-neutral-950/5 text-white",
  alara_light_solid: "bg-neutral-950/40 text-white",
  error: "bg-red-50/50 border border-red-100",
  ghost: "bg-transparent border-none",
  warning: "bg-orange-50/20 border border-orange-100",
  alert: "bg-amber-50/50 border border-amber-100 text-amber-600",
  glassy: "bg-white/10 border border-white/10",
  glassy_high: "bg-white/20 border border-white/20 backdrop-blur-[3px]",
  glassy_dark: "bg-neutral-950/10 border border-neutral-950/5",
} as const;

// CSS-only decorative patterns for better performance
const DECORATIVE_PATTERN_CLASSES = {
  header:
    "before:absolute before:w-[40rem] before:h-[50rem] before:bg-neutral-950/50 before:rounded-full before:blur-[120px] before:top-[0%] before:left-[55%] before:z-0 after:absolute after:w-[50rem] after:h-[40rem] after:bg-neutral-950/50 after:rounded-full after:blur-[100px] after:top-[20%] after:left-[0%] after:z-0",
  "stats-primary":
    "before:absolute before:w-[15rem] before:h-[15rem] before:bg-neutral-950/30 before:rounded-full before:blur-[80px] before:top-[-50%] before:right-[-30%] before:z-0",
  "stats-secondary":
    "before:absolute before:w-[18rem] before:h-[18rem] before:bg-neutral-950/25 before:rounded-full before:blur-[90px] before:top-[-40%] before:left-[-40%] before:z-0",
  "large-dual":
    "before:absolute before:w-[25rem] before:h-[25rem] before:bg-neutral-950/30 before:rounded-full before:blur-[110px] before:top-[-30%] before:right-[-15%] before:z-0 after:absolute after:w-[18rem] after:h-[18rem] after:bg-neutral-950/25 after:rounded-full after:blur-[85px] after:bottom-[-40%] after:left-[-10%] after:z-0",
  none: "",
} as const;

// Optimized decorative circle component
const DecorativeCircle = memo(
  ({ circle, index }: { circle: DecorativeCircle; index: number }) => {
    const style = useMemo(
      () => ({
        width: circle.size,
        height: circle.size,
        backgroundColor: circle.color,
        top: circle.position.top,
        left: circle.position.left,
        right: circle.position.right,
        bottom: circle.position.bottom,
        filter: "blur(50px)",
        opacity: circle.opacity || "0.5",
        willChange: "transform", // Hint to browser for GPU acceleration
      }),
      [circle]
    );

    return <div className="absolute rounded-full" style={style} />;
  }
);

DecorativeCircle.displayName = "DecorativeCircle";

function Card({
  children,
  variant = "default",
  className = "",
  decorativeCircles = [],
  ...props
}: CardProps) {
  // Memoize the variant class lookup
  const variantClass = useMemo(() => VARIANT_CLASSES[variant], [variant]);

  // Memoize the combined className
  const combinedClassName = useMemo(
    () =>
      `relative z-10 rounded-2xl p-2 ${variantClass} ${className} duration-300`,
    [variantClass, className]
  );

  // Early return if no decorative elements to avoid extra DOM elements
  if (decorativeCircles.length === 0) {
    return (
      <div className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }

  // Fallback to JavaScript-based decorative circles
  return (
    <div className="relative rounded-2xl overflow-hidden w-full">
      {/* Decorative circles container with transform3d for GPU acceleration */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        style={{ transform: "translate3d(0, 0, 0)" }}>
        {decorativeCircles.map((circle, index) => (
          <DecorativeCircle key={index} circle={circle} index={index} />
        ))}
      </div>

      {/* Card content */}
      <div className={combinedClassName} {...props}>
        {children}
      </div>
    </div>
  );
}

export default memo(Card);
