"use client";

import { MarketCriteria } from "@/types/market";
import { CriteriaCard } from "./CriteriaCard";

interface CriteriaGridProps {
  criteria: MarketCriteria[];
  title?: string;
  subtitle?: string;
}

// Responsive grid layout for displaying market criteria cards
export function CriteriaGrid({ criteria, title, subtitle }: CriteriaGridProps) {
  // First card spans two rows on larger screens
  const firstCriteria = criteria[0];
  const remainingCriteria = criteria.slice(1);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 h-full overflow-auto">
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="flex flex-col gap-2 mb-2">
          {title && (
            <h2 className="font-mono font-medium text-sm md:text-base text-[#b9b9b9] uppercase tracking-wide">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm md:text-base text-white">{subtitle}</p>
          )}
        </div>
      )}

      {/* Responsive Criteria Grid */}
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns with first spanning 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-2">
        {/* First card - spans 2 rows on xl screens */}
        {firstCriteria && (
          <div className="xl:row-span-2">
            <CriteriaCard criteria={firstCriteria} isLarge className="h-full min-h-[280px] xl:min-h-full" />
          </div>
        )}

        {/* Remaining cards */}
        {remainingCriteria.map((item) => (
          <CriteriaCard key={item.id} criteria={item} />
        ))}
      </div>
    </div>
  );
}
