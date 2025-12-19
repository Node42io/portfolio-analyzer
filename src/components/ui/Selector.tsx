"use client";

import { ChevronDown, Store, Box, LayoutGrid } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SelectorOption {
  id: string;
  label: string;
}

interface SelectorProps {
  label: string;
  value?: SelectorOption;
  options: SelectorOption[];
  onChange: (option: SelectorOption) => void;
  placeholder?: string;
  icon?: "market" | "product" | "type";
  variant?: "default" | "compact";
  disabled?: boolean;
  className?: string;
}

// Icon mapping for different selector types
const iconComponents = {
  market: Store,
  product: Box,
  type: LayoutGrid,
};

// Dropdown selector component with icon support
export function Selector({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  icon = "market",
  variant = "default",
  disabled = false,
  className = "",
}: SelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const IconComponent = iconComponents[icon];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCompact = variant === "compact";
  const hasValue = !!value;

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={ref}>
      <span className="text-label text-[var(--text-labels)] uppercase pl-1">
        {label}
      </span>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between gap-2
          rounded-[var(--radius-md)] overflow-hidden
          transition-colors duration-200
          ${isCompact ? "px-3 py-2" : "px-6 py-4"}
          ${disabled 
            ? "bg-[var(--surface-disabled)] cursor-not-allowed" 
            : hasValue 
              ? "bg-[var(--neutral-lightgray)] cursor-pointer hover:opacity-90" 
              : "bg-[var(--surface-disabled)] cursor-pointer hover:bg-[var(--secondary-400)]"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <IconComponent 
            className={`w-4 h-4 ${hasValue ? "text-[var(--text-dark)]" : "text-[var(--text-disabled)]"}`} 
          />
          <span 
            className={`
              ${isCompact ? "text-base font-medium" : "text-lg font-medium"}
              ${hasValue ? "text-[var(--text-dark)]" : "text-[var(--text-disabled)]"}
            `}
          >
            {value?.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`
            w-4 h-4 transition-transform duration-200
            ${hasValue ? "text-[var(--text-dark)]" : "text-[var(--text-disabled)]"}
            ${isOpen ? "rotate-180" : ""}
          `} 
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && options.length > 0 && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] py-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl max-h-[300px] overflow-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-left text-sm
                transition-colors duration-150
                ${option.id === value?.id 
                  ? "bg-[var(--accent-primary-dark)] text-[var(--accent-primary)]" 
                  : "text-[var(--text-primary)] hover:bg-[var(--secondary-400)]"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

