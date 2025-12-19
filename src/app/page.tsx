"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Card } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { Market } from "@/types/market";
import { ArrowRight, Loader2 } from "lucide-react";

// Home page with quick navigation and market list from Neo4j
export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch markets from API
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const response = await fetch("/api/markets");
        if (response.ok) {
          const data = await response.json();
          setMarkets(data.markets || []);
        }
      } catch (err) {
        console.error("Error fetching markets:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* Header */}
      <Header 
        navigationItems={navigationItems.map(item => ({ ...item, isActive: false }))}
        companyName="Siemens Healthineers"
        divisionName="MRI"
      />

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-[1512px] mx-auto pb-16">
        {/* Hero Section */}
        <div className="mb-16">
          <p className="font-mono text-sm text-[#b9b9b9] uppercase tracking-wider mb-4">
            Portfolio Analysis Platform
          </p>
          <h1 className="text-5xl font-medium text-white leading-tight mb-6">
            Digital Twin for<br />
            Strategic Insights
          </h1>
          <p className="text-lg text-[#b9b9b9] max-w-2xl">
            Analyze markets, competitors, and product-market fit with AI-powered insights 
            from your knowledge graph.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <QuickAccessCard
            title="Markets Analyser"
            description="Explore market types, phases, and innovation areas"
            href="/markets"
            accentColor="#fdff98"
          />
          <QuickAccessCard
            title="Competitors & Products"
            description="Analyze competitive landscape and product positioning"
            href="/competitors"
            accentColor="#d5a96f"
          />
          <QuickAccessCard
            title="Product-Market Fit"
            description="Evaluate fit between your products and target markets"
            href="/product-market-fit"
            accentColor="#6fd59b"
          />
        </div>

        {/* Markets List from Neo4j */}
        <div id="markets-list">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-sm text-[#b9b9b9] uppercase tracking-wider mb-2">
                Markets with Type Analysis
              </p>
              <p className="text-sm text-[#8f8f8f]">
                {loading ? "Loading..." : `${markets.length} markets found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
            </div>
          ) : markets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[#8f8f8f]">
                No markets with market type analysis found. 
                Make sure your Neo4j database is connected and contains market data.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Quick access card component
interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  accentColor: string;
}

function QuickAccessCard({ title, description, href, accentColor }: QuickAccessCardProps) {
  const isAnchor = href.startsWith("#");
  
  const content = (
    <Card className="p-6 h-full hover:border-[rgba(255,255,255,0.4)] transition-colors cursor-pointer group">
      <div 
        className="w-2 h-2 rounded-full mb-4"
        style={{ backgroundColor: accentColor }}
      />
      <h3 className="text-xl font-medium text-white mb-2 group-hover:text-[#fdff98] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-[#b9b9b9]">{description}</p>
    </Card>
  );

  if (isAnchor) {
    return <a href={href}>{content}</a>;
  }

  return <Link href={href}>{content}</Link>;
}

// Market card component
function MarketCard({ market }: { market: Market }) {
  // Determine badge color based on market type
  const typeColors: Record<string, string> = {
    OVERSERVED: "#d56f6f",
    PARTIALLY_OVERSERVED: "#d5a96f",
    UNDERSERVED: "#6fd59b",
    CONSUMPTION: "#6fa8d5",
    NEW_MARKET: "#a56fd5",
    GROWTH: "#6fd5a9",
  };

  const typeColor = typeColors[market.type] || "#d5a96f";
  const typeLabel = market.type.replace(/_/g, " ");

  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="p-5 hover:border-[rgba(255,255,255,0.4)] transition-colors cursor-pointer group h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div 
              className="inline-block px-2 py-0.5 text-xs font-mono uppercase mb-2"
              style={{ backgroundColor: typeColor, color: "#121212" }}
            >
              {typeLabel}
            </div>
            <h3 className="text-lg font-medium text-white mb-2 group-hover:text-[#fdff98] transition-colors truncate">
              {market.name}
            </h3>
            <p className="text-sm text-[#8f8f8f] line-clamp-2">
              {market.coreJobToBeDone}
            </p>
            {market.criteria.length > 0 && (
              <p className="text-xs text-[#b9b9b9] mt-2">
                {market.criteria.length} criteria analyzed
              </p>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-[#8f8f8f] group-hover:text-[#fdff98] transition-colors shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
