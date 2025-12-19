"use client";

import { Card, CardHeader, CardContent, Badge } from "@/components/ui";
import { MarketCriteria } from "@/types/market";

interface CriteriaCardProps {
  criteria: MarketCriteria;
  isLarge?: boolean;
  className?: string;
}

// Criteria card displaying market analysis criteria with severity badge
export function CriteriaCard({ criteria, isLarge = false, className = "" }: CriteriaCardProps) {
  return (
    <Card 
      variant="inner"
      className={`
        flex flex-col gap-2 md:gap-3 p-3
        ${isLarge ? "" : "min-h-[240px] md:min-h-[280px]"}
        ${className}
      `}
    >
      <CardHeader number={criteria.id} title={criteria.title} />
      <Badge severity={criteria.severity} />
      <CardContent className="flex-1 overflow-hidden">
        <p className="text-xs md:text-sm leading-relaxed">{criteria.description}</p>
      </CardContent>
    </Card>
  );
}
