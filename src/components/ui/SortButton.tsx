"use client";

import { ArrowUpDown } from "lucide-react";

interface SortButtonProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

// Button for sorting with icon
export function SortButton({ label, onClick, className = "" }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 
        px-4 py-3
        bg-[var(--surface-default)] 
        rounded-[var(--radius-sm)]
        text-sm font-medium text-[var(--text-primary)]
        hover:bg-[var(--secondary-400)]
        transition-colors duration-200
        ${className}
      `}
    >
      {label}
      <ArrowUpDown className="w-5 h-5" />
    </button>
  );
}

// Sorted by indicator pill
interface SortedByPillProps {
  sortBy: string;
  direction?: string;
  className?: string;
}

export function SortedByPill({ sortBy, direction = "(Newest to older)", className = "" }: SortedByPillProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-[#8a8f98]">Sorted by:</span>
      <div className="
        px-3 py-2
        bg-[var(--accent-primary-dark)] 
        border border-[var(--accent-primary)] 
        rounded-full
        flex items-center gap-2
      ">
        <span className="text-sm font-medium text-[var(--text-primary)]">{sortBy}</span>
        <span className="text-sm text-[var(--text-primary)]">{direction}</span>
      </div>
    </div>
  );
}

