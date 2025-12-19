"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout";
import { navigationItems } from "@/lib/constants";
import { 
  Search, 
  ChevronDown, 
  History, 
  Bookmark, 
  Store, 
  Package, 
  ArrowRight,
  X
} from "lucide-react";

// Types for Product Market Fit calculations
interface PastResearch {
  id: string;
  date: string;
  marketName: string;
  productName: string;
  overallFit: number;
  isSaved: boolean;
}

// Product Market Fit page - Calculate and view product-market fit analysis
export default function ProductMarketFitPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"past" | "saved">("past");
  const [markets, setMarkets] = useState<{ value: string; label: string }[]>([]);
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, _setLoading] = useState(false);

  // Mock past researches - in production this would come from an API
  const [pastResearches] = useState<PastResearch[]>([
    {
      id: "1",
      date: "yesterday",
      marketName: "Yogurt Cup Filling",
      productName: "Dosomat 16",
      overallFit: 39.4,
      isSaved: false,
    },
    {
      id: "2",
      date: "26.11.2025",
      marketName: "Fresh Cheese Cup Filling",
      productName: "Dosomat 20",
      overallFit: 25.3,
      isSaved: false,
    },
    {
      id: "3",
      date: "26.11.2025",
      marketName: "Cream Cup Filling",
      productName: "Rotary XL",
      overallFit: 38.1,
      isSaved: true,
    },
  ]);

  // Filter researches based on active tab
  const filteredResearches = useMemo(() => {
    if (activeTab === "saved") {
      return pastResearches.filter(r => r.isSaved);
    }
    return pastResearches;
  }, [pastResearches, activeTab]);

  // Fetch markets and products on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch markets
        const marketsRes = await fetch("/api/markets");
        if (marketsRes.ok) {
          const data = await marketsRes.json();
          setMarkets(data.markets?.map((m: { name: string }) => ({ 
            value: m.name, 
            label: m.name 
          })) || []);
        }

        // Fetch products
        const productsRes = await fetch("/api/products");
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products?.map((p: { name: string }) => ({ 
            value: p.name, 
            label: p.name 
          })) || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  // Handle calculate button click
  const handleCalculate = () => {
    if (!selectedMarket || !selectedProduct) return;
    // Navigate to calculation results or trigger calculation
    console.log("Calculating fit for:", selectedMarket, selectedProduct);
  };

  // Get fit color based on percentage
  const getFitColor = (fit: number): string => {
    if (fit >= 35) return "bg-[#caea8f]"; // Green for good fit
    if (fit >= 25) return "bg-[#f4c484]"; // Yellow/orange for medium fit
    return "bg-[#f4847c]"; // Red for poor fit
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <Header 
        navigationItems={navigationItems.map(item => ({ 
          ...item, 
          isActive: item.id === "product-market-fit" 
        }))}
        companyName="Waldner"
        divisionName="All Products"
      />

      <main className="pt-24 px-6 max-w-[1512px] mx-auto pb-16">
        {/* Page Title */}
        <h1 className="text-[32px] font-medium text-white mb-6">
          Product Market Fit
        </h1>

        {/* Start a New Calculation Section */}
        <section className="bg-[#1b1e23] p-4 mb-6">
          <div className="mb-6">
            <h2 className="font-medium text-white text-base uppercase mb-2">
              Start a new calculation
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-base">
              Select a Product and a Market to start
            </p>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.1)] pt-6">
            <div className="flex items-end justify-between">
              {/* Dropdowns Container */}
              <div className="flex items-center gap-3">
                {/* Market Dropdown */}
                <SearchDropdown
                  label="Market"
                  icon={<Store className="w-4 h-4" />}
                  options={markets}
                  value={selectedMarket}
                  onChange={setSelectedMarket}
                  placeholder="Search or Select a Market"
                />

                {/* X Connector */}
                <div className="flex items-center justify-center w-11 h-[71px]">
                  <X className="w-6 h-6 text-[#b9b9b9]" />
                </div>

                {/* Product Dropdown */}
                <SearchDropdown
                  label="Product"
                  icon={<Package className="w-4 h-4" />}
                  options={products}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  placeholder="Search or Select a Product"
                />
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={!selectedMarket || !selectedProduct}
                className={`
                  flex items-center gap-3 px-4 py-4 h-14 
                  ${selectedMarket && selectedProduct 
                    ? "bg-[#fdff98] cursor-pointer" 
                    : "bg-[#fdff98]/50 cursor-not-allowed"
                  }
                `}
              >
                <span className="text-[#14171b] font-medium text-base whitespace-nowrap">
                  Calculate Product Market fit
                </span>
                <ArrowRight className="w-6 h-6 text-[#14171b]" />
              </button>
            </div>
          </div>
        </section>

        {/* Resume or View Saved Section */}
        <section className="bg-[#1b1e23] p-4">
          <div className="mb-6">
            <h2 className="font-mono text-white text-base uppercase mb-2">
              Resume or View Saved
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-base">
              Continue your work or review what you saved.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("past")}
              className={`
                flex items-center gap-1 pb-1 text-base
                ${activeTab === "past" 
                  ? "text-white border-b border-white" 
                  : "text-[rgba(255,255,255,0.8)]"
                }
              `}
            >
              <History className="w-5 h-5" />
              <span>Past Researches</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`
                flex items-center gap-1 pb-1 text-base
                ${activeTab === "saved" 
                  ? "text-white border-b border-white" 
                  : "text-[rgba(255,255,255,0.8)]"
                }
              `}
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved Researches</span>
            </button>
          </div>

          {/* Research List */}
          <div className="flex gap-6">
            <div className="flex-1 overflow-hidden">
              {filteredResearches.length === 0 ? (
                <div className="py-8 text-center text-[rgba(255,255,255,0.6)]">
                  No {activeTab === "saved" ? "saved" : "past"} researches found
                </div>
              ) : (
                filteredResearches.map((research) => (
                  <ResearchRow key={research.id} research={research} getFitColor={getFitColor} />
                ))
              )}
            </div>

            {/* Scrollbar placeholder */}
            <div className="w-3 bg-[#20252b] rounded-full">
              <div className="w-3 h-[131px] bg-[#4c5663] rounded-full" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Search Dropdown Component
interface SearchDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
}

function SearchDropdown({ label, icon, options, value, onChange, placeholder }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[#b9b9b9] text-base uppercase">{label}</span>
        {icon}
      </div>

      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-[301px] h-[71px] px-6 py-4 border border-[rgba(255,255,255,0.2)] bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-[#bfbdb9]" />
            <span className="text-sm text-[#bfbdb9]">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown className="w-6 h-6 text-[#bfbdb9]" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 z-50 w-[301px] max-h-[300px] overflow-y-auto border border-[rgba(255,255,255,0.2)] bg-[#1a1a1b]">
              {/* Search Input */}
              <div className="p-3 border-b border-[rgba(255,255,255,0.1)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b9b9b9]" />
                  <input
                    type="text"
                    placeholder={`Search ${label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#fdff98] rounded"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options */}
              <button
                onClick={() => { onChange(null); setIsOpen(false); setSearchTerm(""); }}
                className="w-full px-4 py-2 text-left text-sm text-[#b9b9b9] hover:bg-[rgba(255,255,255,0.1)]"
              >
                Clear selection
              </button>
              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setIsOpen(false); setSearchTerm(""); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.1)] ${
                    option.value === value ? "text-[#fdff98] bg-[rgba(253,255,152,0.1)]" : "text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Research Row Component
interface ResearchRowProps {
  research: PastResearch;
  getFitColor: (fit: number) => string;
}

function ResearchRow({ research, getFitColor }: ResearchRowProps) {
  return (
    <div className="flex items-center gap-3 py-4 border-b border-[rgba(255,255,255,0.1)]">
      {/* Date */}
      <div className="w-[140px]">
        <span className="text-sm text-[rgba(255,255,255,0.6)]">{research.date}</span>
      </div>

      {/* Market */}
      <div className="w-[200px]">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-mono text-[#b9b9b9] text-base uppercase">Market</span>
          <Store className="w-4 h-4 text-[#b9b9b9]" />
        </div>
        <p className="text-white text-xl font-medium">{research.marketName}</p>
      </div>

      {/* X Connector */}
      <div className="w-11 flex justify-center">
        <X className="w-6 h-6 text-[#b9b9b9]" />
      </div>

      {/* Product */}
      <div className="w-[200px]">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-mono text-[#b9b9b9] text-base uppercase">Product</span>
          <Package className="w-4 h-4 text-[#b9b9b9]" />
        </div>
        <p className="text-white text-xl font-medium">{research.productName}</p>
      </div>

      {/* Arrow */}
      <div className="w-11 flex justify-center">
        <ArrowRight className="w-6 h-6 text-[#b9b9b9]" />
      </div>

      {/* Overall Fit */}
      <div>
        <div className="flex items-center gap-1 mb-1">
          <span className="font-mono text-[#b9b9b9] text-base uppercase">Overall Fit</span>
        </div>
        <div className={`px-4 py-2 border border-[rgba(255,255,255,0.2)] ${getFitColor(research.overallFit)}`}>
          <span className="text-[#14171b] text-xl font-medium">
            {research.overallFit.toFixed(1).replace(".", ",")}%
          </span>
        </div>
      </div>
    </div>
  );
}

