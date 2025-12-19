"use client";

import { Market, MarketType } from "@/types/market";

interface MarketHeaderProps {
  market: Market;
}

// Maps market type to display label
const marketTypeLabels: Record<MarketType, string> = {
  OVERSERVED: "OVERSERVED MARKET",
  PARTIALLY_OVERSERVED: "PARTIALLY OVERSERVED MARKET",
  UNDERSERVED: "UNDERSERVED MARKET",
  CONSUMPTION: "CONSUMPTION MARKET",
  NEW_MARKET: "NEW MARKET",
};

// Market header section with type label, name, job-to-be-done, and metrics
export function MarketHeader({ market }: MarketHeaderProps) {
  return (
    <div className="px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
      {/* Market Type and Name */}
      <div className="flex flex-col gap-2 md:gap-3">
        <p className="text-label text-[#b9b9b9] text-sm md:text-base">
          {marketTypeLabels[market.type]}
        </p>
        <h1 className="text-2xl md:text-4xl font-medium text-white leading-tight">
          {market.name}
        </h1>
      </div>

      {/* Job to be Done and Metrics */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Core Job to be Done */}
        <div className="flex flex-col gap-2 md:gap-3 flex-1 lg:max-w-[680px]">
          <p className="text-label text-[#b9b9b9] text-xs md:text-sm">Core Job to be Done</p>
          <p className="text-sm md:text-base text-white leading-normal">
            {market.coreJobToBeDone}
          </p>
        </div>

        {/* Metrics */}
        <div className="flex gap-6 md:gap-8 flex-wrap">
          <MetricItem label="TAM" value={market.metrics.tam} />
          <MetricItem label="CAGR" value={market.metrics.cagr} />
        </div>
      </div>
    </div>
  );
}

// Individual metric display item
function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <p className="text-label text-[#b9b9b9] text-xs md:text-sm">{label}</p>
      <p className="text-sm md:text-base text-white font-medium">{value}</p>
    </div>
  );
}
