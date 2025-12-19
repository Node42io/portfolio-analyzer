"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "ghost" | "icon";
  size?: "sm" | "md" | "lg" | "icon";
}

// Variant styles for different button appearances
const variantStyles = {
  default: "bg-[rgba(23,24,33,0.8)] border border-[rgba(255,255,255,0.2)] text-white hover:bg-[rgba(35,36,48,0.9)]",
  ghost: "bg-transparent text-white hover:bg-[rgba(255,255,255,0.1)]",
  icon: "bg-[rgba(23,24,33,0.8)] border border-[rgba(255,255,255,0.2)] backdrop-blur-[15px]",
};

// Size styles for different button sizes - responsive
const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  icon: "w-[56px] h-[50px] md:w-[69px] md:h-[62px] p-0",
};

// Reusable Button component with multiple variants and sizes
export function Button({ 
  children, 
  variant = "default", 
  size = "md",
  className = "",
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        transition-colors duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
