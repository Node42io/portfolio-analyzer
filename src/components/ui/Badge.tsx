"use client";

import { SeverityLevel } from "@/types/market";

interface BadgeProps {
  severity: SeverityLevel;
  className?: string;
}

// Maps severity levels to their corresponding background colors
const severityColors: Record<SeverityLevel, string> = {
  HIGH: "bg-[#d56f6f]",
  MEDIUM: "bg-[#d5a96f]",
  LOW: "bg-[#6fd59b]",
};

// Badge component displays severity level with appropriate color coding
export function Badge({ severity, className = "" }: BadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center justify-center
        px-2 py-1
        font-mono text-base font-normal
        text-[#121212]
        ${severityColors[severity]}
        ${className}
      `}
    >
      {severity}
    </div>
  );
}

