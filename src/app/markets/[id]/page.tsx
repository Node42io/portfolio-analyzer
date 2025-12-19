"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Header, Sidebar, BackButton } from "@/components/layout";
import { MarketHeader, CriteriaGrid } from "@/components/market";
import { navigationItems, marketDetailTabs } from "@/lib/constants";
import { Market } from "@/types/market";
import { sampleMarket } from "@/lib/sample-data";

// Market detail page showing market type analysis with criteria cards
export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("market-type");
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market data from API
  useEffect(() => {
    async function fetchMarket() {
      try {
        setLoading(true);
        const response = await fetch(`/api/markets/${marketId}`);
        
        if (!response.ok) {
          // Fall back to sample data if API fails
          console.warn("Using sample data - API not available");
          setMarket(sampleMarket);
          return;
        }

        const data = await response.json();
        
        if (data.market) {
          setMarket(data.market);
        } else {
          // Fall back to sample data
          setMarket(sampleMarket);
        }
      } catch (err) {
        console.error("Error fetching market:", err);
        // Fall back to sample data on error
        setMarket(sampleMarket);
        setError("Using sample data - could not connect to database");
      } finally {
        setLoading(false);
      }
    }

    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  // Update navigation to show Markets Analyser as active
  const activeNav = navigationItems.map(item => ({
    ...item,
    isActive: item.id === "markets"
  }));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] flex items-center justify-center">
        <div className="text-white text-lg">Loading market data...</div>
      </div>
    );
  }

  // If no market data available
  if (!market) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] flex items-center justify-center">
        <div className="text-white text-lg">Market not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* Header */}
      <Header 
        navigationItems={activeNav}
        companyName="Siemens Healthineers"
        divisionName="MRI"
      />

      {/* Main Content Area */}
      <main className="pt-20 pb-8 px-4 lg:px-8 min-h-screen">
        <div className="max-w-[1400px] mx-auto h-full">
          {/* Error banner if using sample data */}
          {error && (
            <div className="mb-4 p-3 bg-[rgba(213,169,111,0.2)] border border-[#d5a96f] text-[#d5a96f] text-sm rounded">
              {error}
            </div>
          )}

          {/* Back Button + Content Row */}
          <div className="flex items-start gap-4 h-full">
            {/* Back Button - hidden on small mobile */}
            <div className="shrink-0 pt-2 hidden sm:block">
              <BackButton />
            </div>

            {/* Main Glass Card */}
            <div className="glass-card flex-1 flex flex-col min-h-0">
              {/* Mobile Back Button - inside card on mobile */}
              <div className="sm:hidden p-4 pb-0">
                <BackButton />
              </div>

              {/* Market Header */}
              <MarketHeader market={market} />

              {/* Divider */}
              <div className="w-full h-px bg-[rgba(255,255,255,0.2)]" />

              {/* Content Area with Sidebar */}
              <div className="flex flex-col md:flex-row flex-1">
                {/* Sidebar - hidden on mobile/tablet */}
                <div className="hidden md:block shrink-0">
                  <Sidebar
                    tabs={marketDetailTabs}
                    activeTabId={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                {/* Mobile Tab Selector */}
                <div className="md:hidden w-full border-b border-[rgba(255,255,255,0.2)]">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full bg-transparent text-white p-4 font-medium text-lg border-none outline-none cursor-pointer"
                  >
                    {marketDetailTabs.map((tab) => (
                      <option key={tab.id} value={tab.id} className="bg-[#14171b]">
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {activeTab === "market-type" && market.criteria.length > 0 && (
                    <CriteriaGrid
                      criteria={market.criteria}
                      title="Criteria"
                      subtitle={`Why this market is considered ${market.type.toLowerCase().replace(/_/g, " ")}.`}
                    />
                  )}

                  {activeTab === "market-type" && market.criteria.length === 0 && (
                    <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                      <p className="text-[#8f8f8f] text-lg text-center px-4">
                        No market type analysis criteria available for this market.
                      </p>
                    </div>
                  )}
                  
                  {activeTab !== "market-type" && (
                    <div className="flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                      <p className="text-[#8f8f8f] text-lg text-center px-4">
                        {marketDetailTabs.find(t => t.id === activeTab)?.label} content coming soon...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
