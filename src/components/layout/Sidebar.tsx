"use client";

import { Tab, TabList } from "@/components/ui";
import { SidebarTab } from "@/types/market";

interface SidebarProps {
  tabs: SidebarTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

// Sidebar component with vertical tab navigation for market detail views
export function Sidebar({ tabs, activeTabId, onTabChange }: SidebarProps) {
  return (
    <aside className="w-[140px] lg:w-[148px] h-full shrink-0 overflow-y-auto">
      <TabList>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={tab.label}
            isActive={tab.id === activeTabId}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </TabList>
    </aside>
  );
}
