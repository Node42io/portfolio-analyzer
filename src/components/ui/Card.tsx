"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "inner";
}

// Variant styles for different card appearances
const variantStyles = {
  default: "bg-[#111215] border border-[rgba(255,255,255,0.2)]",
  glass: "glass-card",
  inner: "bg-[#111215] border border-[rgba(255,255,255,0.2)]",
};

// Reusable Card component with multiple style variants
export function Card({ children, className = "", variant = "default" }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

// Card header section with title and optional subtitle
interface CardHeaderProps {
  number?: string | number;
  title: string;
  className?: string;
}

export function CardHeader({ number, title, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {number && (
        <p className="font-mono text-base text-[#8f8f8f]">{number}</p>
      )}
      <p className="font-medium text-base text-white leading-normal">{title}</p>
    </div>
  );
}

// Card content/body section
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`text-sm text-white leading-normal ${className}`}>
      {children}
    </div>
  );
}

