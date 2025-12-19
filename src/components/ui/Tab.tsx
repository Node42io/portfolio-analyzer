"use client";

interface TabProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

// Sidebar Tab component for navigation within the market detail view
export function Tab({ label, isActive = false, onClick, className = "" }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full
        flex flex-col items-start justify-center
        px-3 lg:px-4 py-4 lg:py-0
        min-h-[80px] lg:min-h-[111px]
        border-b border-[rgba(255,255,255,0.2)]
        transition-colors duration-200
        text-left
        ${isActive 
          ? "bg-[#fdff97] text-[#14171b]" 
          : "bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)]"
        }
        ${className}
      `}
    >
      <span className="font-medium text-base lg:text-lg leading-tight">
        {label}
      </span>
    </button>
  );
}

// Tab list container for grouping tabs
interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className = "" }: TabListProps) {
  return (
    <div 
      className={`
        flex flex-col
        border-r border-[rgba(255,255,255,0.2)]
        h-full
        ${className}
      `}
    >
      {children}
    </div>
  );
}
