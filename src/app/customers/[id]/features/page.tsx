"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { PillTabs } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { 
  ArrowLeft, Store, Box, ArrowLeftRight, LayoutGrid, ChevronDown, 
  Mic, Loader2, Search, Eye, Sparkles
} from "lucide-react";
import { Product } from "@/types/customer";

// Map customer IDs to display names
const customerNames: Record<string, string> = {
  "danone": "Danone",
  "rugenwalder": "Rügenwalder Mühle",
  "bechtel": "Privatmolkerei Bechtel",
};

// Feature with Kano ranges
interface KanoFeature {
  id: string;
  name: string;
  unitOfMeasure: string;
  reverseRange: string;
  mustBeRange: string;
  oneDimensionalRange: string;
  attractiveRange: string;
  classifiedAt: string | null;
  // For highlighting "new learning" updates
  isNewLearning?: boolean;
  updatedColumn?: "reverse" | "must_be" | "one_dimensional" | "attractive";
  previousValue?: string;
}

// Features Levels page - displays market-specific Kano ranges in a table
export default function FeaturesLevelsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const customerName = customerNames[customerId] || customerId;
  
  // Read values from URL params
  const marketName = searchParams.get("marketName") || "";
  const commodityId = searchParams.get("commodityId") || "";
  const commodityName = searchParams.get("commodityName") || "";
  const initialProduct = searchParams.get("product") || "";

  const [features, setFeatures] = useState<KanoFeature[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("features");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProduct);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Mock date for previous sessions
  const mockDate = "13.12.2025";
  const previousDates = ["25.11.2025", "18.11.2025"];

  // Fetch products filtered by commodity on mount
  useEffect(() => {
    async function fetchProducts() {
      if (!commodityId) return;
      try {
        const response = await fetch(`/api/products?commodityId=${commodityId}&companyId=waldner`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    }
    fetchProducts();
  }, [commodityId]);

  // Helper function to increase a numeric value by 5% in text
  const increaseNumericValue = (text: string): string => {
    // Find numbers in the text and increase them by 5%
    return text.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const increased = Math.round(num * 1.05 * 100) / 100;
      return increased.toString();
    });
  };

  // Fetch Kano ranges for the market
  useEffect(() => {
    async function fetchKanoRanges() {
      if (!marketName) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/kano-ranges?marketName=${encodeURIComponent(marketName)}`);
        if (response.ok) {
          const data = await response.json();
          // Transform and add mock "new learning" updates to some features
          // Mark selected features as "new learning" with increased values
          const featuresWithUpdates = (data.features || []).map((feature: KanoFeature, index: number) => {
            // Mark every 4th feature starting from index 1 as "new learning"
            if ((index === 1 || index === 5 || index === 9 || index === 13) && index < 15) {
              const columns = ["reverse", "must_be", "one_dimensional", "attractive"] as const;
              const updatedColumn = columns[index % 4];
              
              // Create new feature with increased value in the updated column
              const updatedFeature = { ...feature, isNewLearning: true, updatedColumn };
              
              // Increase the value by 5% for the updated column
              switch (updatedColumn) {
                case "reverse":
                  updatedFeature.reverseRange = increaseNumericValue(feature.reverseRange);
                  break;
                case "must_be":
                  updatedFeature.mustBeRange = increaseNumericValue(feature.mustBeRange);
                  break;
                case "one_dimensional":
                  updatedFeature.oneDimensionalRange = increaseNumericValue(feature.oneDimensionalRange);
                  break;
                case "attractive":
                  updatedFeature.attractiveRange = increaseNumericValue(feature.attractiveRange);
                  break;
              }
              
              return updatedFeature;
            }
            return feature;
          });
          setFeatures(featuresWithUpdates);
        }
      } catch (err) {
        console.error("Error fetching Kano ranges:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchKanoRanges();
  }, [marketName]);

  // Filter features based on search
  const filteredFeatures = features.filter((feature) =>
    feature.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // View switcher tabs
  const viewTabs = [
    { id: "features", label: "Features Levels" },
    { id: "needs", label: "Market Needs" },
    { id: "restrictions", label: "Product Restrictions" },
    { id: "fit", label: "Product/Market fit" },
  ];

  // Handle view change - navigate to different pages
  // Handle view change - navigate to different pages
  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    const params = new URLSearchParams();
    if (marketName) params.set("marketName", marketName);
    if (commodityId) params.set("commodityId", commodityId);
    if (commodityName) params.set("commodityName", commodityName);
    if (selectedProduct) params.set("product", selectedProduct);
    
    if (viewId === "restrictions") {
      window.location.href = `/customers/${customerId}/restrictions?${params.toString()}`;
    } else if (viewId === "needs") {
      window.location.href = `/customers/${customerId}/needs?${params.toString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* Header */}
      <Header
        navigationItems={navigationItems.map((item) => ({
          ...item,
          isActive: item.id === "customer-insights",
        }))}
        companyName="Waldner"
        divisionName=""
      />

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-[1512px] mx-auto pb-16">
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-4">
          {/* Back Button and Title */}
          <div className="flex items-center gap-2">
            <Link 
              href={`/customers/${customerId}`} 
              className="text-white hover:text-[var(--accent-primary)] transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-4xl font-medium text-white">Customer {customerName}</h1>
          </div>

          {/* Selection Row with View Tabs */}
          <div className="flex items-end justify-between pb-4 border-b-2 border-[var(--border-default)]">
            {/* Market, Product Type, and Product Display */}
            <div className="flex items-center gap-2">
              {/* Market Display - Fixed */}
              <div className="flex flex-col gap-2 opacity-50">
                <span className="text-label text-[var(--text-labels)] uppercase pl-1">Market</span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-disabled)] rounded-[var(--radius-md)] cursor-not-allowed">
                  <Store className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-base font-medium text-[var(--text-muted)]">
                    {marketName ? decodeURIComponent(marketName) : "—"}
                  </span>
                </div>
              </div>

              {/* Arrow Separator */}
              <div className="flex items-center pt-8">
                <ArrowLeftRight className="w-6 h-6 text-[var(--text-primary)]" />
              </div>

              {/* Product Selector */}
              <div className="flex flex-col gap-2 relative">
                <span className="text-label text-[var(--text-labels)] uppercase pl-1">Product</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className="flex items-center justify-between gap-2 min-w-[180px] px-3 py-2 bg-[var(--neutral-lightgray)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-[var(--text-dark)]" />
                      <span className={`text-base font-medium ${selectedProduct ? "text-[var(--text-dark)]" : "text-[var(--text-dark)] opacity-60"}`}>
                        {selectedProduct ? decodeURIComponent(selectedProduct) : "Select Product"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-dark)] transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {/* Product Dropdown */}
                {productDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 w-[280px] mt-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl">
                    <div className="p-2 border-b border-[var(--border-default)]">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--surface-page)] text-[var(--text-primary)] rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent-primary)]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[250px] overflow-auto py-1">
                      {filteredProducts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No products found</div>
                      ) : (
                        filteredProducts.map((product, index) => (
                          <button
                            key={`${product.id}-${index}`}
                            onClick={() => {
                              setSelectedProduct(product.name);
                              setProductDropdownOpen(false);
                              setProductSearch("");
                            }}
                            className="w-full px-4 py-3 text-left text-base text-[var(--text-primary)] hover:bg-[var(--secondary-400)] transition-colors"
                          >
                            {product.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Tabs and Record Button */}
            <div className="flex items-center gap-3">
              <PillTabs
                tabs={viewTabs}
                activeTab={activeView}
                onTabChange={handleViewChange}
              />
              <button className="flex items-center gap-2 px-4 py-3 bg-[var(--accent-primary)] text-[var(--text-dark)] rounded-full font-medium hover:opacity-90 transition-opacity">
                <Mic className="w-4 h-4" />
                Record Session
              </button>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-end justify-between mb-4">
          <div className="flex flex-col gap-4 max-w-[913px]">
            <h2 className="text-2xl font-medium text-white">Features Levels</h2>
            <p className="text-base text-white">
              The features are product-related, regardless of the selected market. Each has four ranges from less to more attractive, with highlighted boxes showing the current product level. Customers can choose to prioritize different parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-white" />
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary)] rounded-full">
              <Box className="w-4 h-4 text-[var(--text-dark)]" />
              <span className="text-sm text-[var(--text-dark)]">Selected Product Value</span>
            </div>
          </div>
        </div>

        {/* Features Table - Full width layout */}
        <div className="flex flex-col">
          {/* Top Row: Search + Date/Column Headers */}
          <div className="flex">
            {/* Search Section */}
            <div className="w-[320px] flex flex-col gap-1">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1f2329] border border-[#2a2f38] rounded-lg h-[52px]">
                <Search className="w-5 h-5 text-[#8a8f98]" />
                <input
                  type="text"
                  placeholder="Search Feature"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[var(--text-primary)] text-sm focus:outline-none placeholder:text-[#8a8f98]"
                />
              </div>
              <div className="flex items-center gap-2 px-1 py-2 h-[32px]">
                <span className="px-2 py-1 bg-[var(--secondary-400)] rounded-full text-xs text-[var(--accent-primary)]">
                  {filteredFeatures.length}
                </span>
                <span className="text-xs text-white uppercase">features</span>
              </div>
            </div>

            {/* Column Headers Section */}
            <div className="flex-1 flex flex-col ml-4">
              {/* Date Headers */}
              <div className="flex h-[45px] border border-[var(--border-default)]">
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent-primary)]">
                  <LayoutGrid className="w-4 h-4 text-[var(--text-dark)]" />
                  <span className="text-base font-medium text-[var(--text-dark)]">Default</span>
                </div>
                <div className="flex items-center justify-center px-3 border-l border-[var(--border-default)]">
                  <span className="text-base text-[#b9b9b9]">{mockDate}</span>
                </div>
                {previousDates.map((date, i) => (
                  <div key={i} className="flex items-center justify-center px-3 border-l border-[var(--border-default)]">
                    <span className="text-base text-[#b9b9b9]">{date}</span>
                  </div>
                ))}
              </div>

              {/* Kano Category Headers */}
              <div className="flex h-[39px]">
                <div className="flex-1 flex items-center px-2 py-2 bg-[var(--secondary-700)] border border-[var(--border-default)]">
                  <span className="text-base text-[#b9b9b9] uppercase">Reverse</span>
                </div>
                <div className="flex-1 flex items-center px-2 py-2 bg-[var(--secondary-700)] border-y border-r border-[var(--border-default)]">
                  <span className="text-base text-[#b9b9b9] uppercase">Must Be</span>
                </div>
                <div className="flex-1 flex items-center px-2 py-2 bg-[var(--secondary-700)] border-y border-r border-[var(--border-default)]">
                  <span className="text-base text-[#b9b9b9] uppercase">One Dimensional</span>
                </div>
                <div className="flex-1 flex items-center px-2 py-2 bg-[var(--secondary-700)] border-y border-r border-[var(--border-default)]">
                  <span className="text-base text-[#b9b9b9] uppercase">Attractive</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col max-h-[556px] overflow-y-auto">
              {filteredFeatures.map((feature) => (
                <FeatureRow key={feature.id} feature={feature} />
              ))}
              {filteredFeatures.length === 0 && (
                <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
                  No features found for this market.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Feature row component with Kano range cells
function FeatureRow({ feature }: { feature: KanoFeature }) {
  return (
    <div className="flex border-b border-[rgba(243,241,235,0.1)]">
      {/* Feature Name - left column */}
      <div className="w-[320px] flex items-center px-4 py-4 bg-[#1b1e23] border-r border-[var(--border-default)]">
        <span className="text-base text-[var(--neutral-white)]">{feature.name}</span>
      </div>

      {/* Kano Range Cells - with margin to match header */}
      <div className="flex-1 flex ml-4">
        <KanoCell 
          range={feature.reverseRange} 
          isHighlighted={feature.isNewLearning && feature.updatedColumn === "reverse"}
        />
        <KanoCell 
          range={feature.mustBeRange} 
          isHighlighted={feature.isNewLearning && feature.updatedColumn === "must_be"}
        />
        <KanoCell 
          range={feature.oneDimensionalRange} 
          isHighlighted={feature.isNewLearning && feature.updatedColumn === "one_dimensional"}
        />
        <KanoCell 
          range={feature.attractiveRange} 
          isHighlighted={feature.isNewLearning && feature.updatedColumn === "attractive"}
        />
      </div>
    </div>
  );
}

// Kano cell component
function KanoCell({ range, isHighlighted = false }: { range: string; isHighlighted?: boolean }) {
  // Truncate for display
  const displayText = range.length > 150 ? range.substring(0, 150) + "..." : range;
  
  return (
    <div 
      className={`flex-1 flex flex-col justify-between p-2 min-h-[100px] border-l border-[var(--border-default)] ${
        isHighlighted 
          ? "bg-[var(--accent-primary)] bg-opacity-10 border-[var(--accent-primary)]" 
          : "bg-[var(--secondary-700)]"
      }`}
    >
      {isHighlighted && (
        <div className="flex items-center gap-1 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs text-[var(--accent-primary)] uppercase font-medium">New Learning</span>
        </div>
      )}
      <p className={`text-sm ${isHighlighted ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>
        {displayText}
      </p>
    </div>
  );
}

