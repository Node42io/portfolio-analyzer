"use client";

import { AlertCircle } from "lucide-react";
import { ConstraintSensitivity, InsightLevel } from "@/types/customer";

type SeverityType = ConstraintSensitivity | InsightLevel;

interface SeverityBadgeProps {
  severity: SeverityType;
  showIcon?: boolean;
  className?: string;
}

// Color configurations for different severity levels
const severityConfig: Record<SeverityType, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: "bg-[var(--severity-critical)]", text: "text-[#3b282a]", label: "CRITICAL" },
  HIGH: { bg: "bg-[var(--severity-high)]", text: "text-[#3b282a]", label: "HIGH" },
  MEDIUM: { bg: "bg-[var(--severity-medium)]", text: "text-[#3b2a1a]", label: "MEDIUM" },
  LOW: { bg: "bg-[var(--severity-low)]", text: "text-[#1a3b2a]", label: "LOW" },
};

// Badge component for displaying severity/insight levels with color coding
export function SeverityBadge({ severity, showIcon = false, className = "" }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <div
      className={`
        inline-flex items-center justify-center gap-1
        px-2 py-1 rounded-full
        font-mono text-xs font-normal uppercase
        ${config.bg} ${config.text}
        ${className}
      `}
    >
      {showIcon && severity === "CRITICAL" && (
        <AlertCircle className="w-3 h-3" />
      )}
      {config.label}
    </div>
  );
}

