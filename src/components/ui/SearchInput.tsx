"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Search input with icon
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "" 
}: SearchInputProps) {
  return (
    <div className={`
      flex items-center gap-4 
      px-4 py-3 
      bg-[var(--surface-default)] 
      border border-[var(--surface-default)] 
      rounded-[10px]
      ${className}
    `}>
      <Search className="w-5 h-5 text-[var(--text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          flex-1 bg-transparent 
          text-sm text-[var(--text-primary)] 
          placeholder:text-[var(--text-muted)]
          outline-none
        "
      />
    </div>
  );
}

