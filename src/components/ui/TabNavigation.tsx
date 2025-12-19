"use client";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

// Horizontal tab navigation with optional count badges
export function TabNavigation({ tabs, activeTab, onTabChange, className = "" }: TabNavigationProps) {
  return (
    <div className={`flex items-center gap-6 border-b border-[var(--secondary-400)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1 h-8 capitalize
              transition-colors duration-200
              ${isActive 
                ? "text-[var(--accent-primary)] border-b border-[var(--accent-primary)]" 
                : "text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
              }
            `}
          >
            <span className="text-base">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`
                flex items-center justify-center
                px-2 py-0.5 min-w-[32px] h-4
                text-xs font-mono
                rounded-full
                bg-[var(--secondary-400)]
                ${isActive ? "text-[var(--accent-primary)]" : "text-[var(--accent-primary)]"}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Pill-style tab navigation for view switcher
interface PillTabsProps {
  tabs: { id: string; label: string; disabled?: boolean }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeTab, onTabChange, className = "" }: PillTabsProps) {
  return (
    <div className={`flex items-center gap-3 p-2 bg-[var(--secondary-default)] rounded-full ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled === true;
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={`
              px-3 py-3 rounded-full
              text-base transition-colors duration-200
              ${isDisabled
                ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                : isActive 
                  ? "bg-[var(--secondary-400)] text-[var(--accent-primary)]" 
                  : "text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

