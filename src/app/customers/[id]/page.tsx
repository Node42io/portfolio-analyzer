"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { SearchInput, SortButton, SortedByPill } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { Product, MarketOption, PastSession } from "@/types/customer";
import { 
  ArrowLeft, Store, Box, ArrowLeftRight, LayoutGrid, ChevronDown,
  TrendingUp, BookOpen, CheckSquare, Loader2
} from "lucide-react";

// Commodity type for Product Types
interface CommodityOption {
  id: string;
  name: string;
  commodityId: string;
}

// Map customer IDs to display names
const customerNames: Record<string, string> = {
  "danone": "Danone",
  "rugenwalder": "Rügenwalder Mühle",
  "bechtel": "Privatmolkerei Bechtel",
};

// Customer detail page - select product type and market for analysis
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const customerName = customerNames[customerId] || customerId;

  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMarket, setSelectedMarket] = useState<MarketOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Search states for dropdowns
  const [productSearch, setProductSearch] = useState("");
  const [marketSearch, setMarketSearch] = useState("");
  
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [commodityDropdownOpen, setCommodityDropdownOpen] = useState(false);

  // Fetch only commodities on mount - products and markets loaded after commodity selection
  useEffect(() => {
    async function fetchData() {
      try {
        const commoditiesRes = await fetch("/api/commodities");

        if (commoditiesRes.ok) {
          const data = await commoditiesRes.json();
          setCommodities(data.commodities || []);
        }

        // Generate sample past sessions
        setSessions(generateSampleSessions());
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch products AND markets when commodity (product type) is selected
  useEffect(() => {
    async function fetchProductsAndMarkets() {
      if (!selectedCommodity) {
        // Clear products and markets when no commodity selected
        setProducts([]);
        setMarkets([]);
        setSelectedProduct(null);
        setSelectedMarket(null);
        return;
      }
      
      try {
        // Fetch products filtered by commodity AND our company (Waldner), markets by commodity
        const [productsRes, marketsRes] = await Promise.all([
          fetch(`/api/products?commodityId=${selectedCommodity.commodityId}&companyId=waldner`),
          fetch(`/api/markets?commodityId=${selectedCommodity.commodityId}`),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
          // Clear selection when commodity changes
          setSelectedProduct(null);
        }

        if (marketsRes.ok) {
          const data = await marketsRes.json();
          const marketOptions: MarketOption[] = (data.markets || []).map((m: { id: string; name: string; cpcCode?: string; hasCoreJobs?: boolean; coreJobCount?: number }) => ({
            id: m.id,
            name: m.name,
            cpcCode: m.cpcCode,
            hasCoreJobs: m.hasCoreJobs || false,
            coreJobCount: m.coreJobCount || 0,
          }));
          // Sort markets: those with Core Jobs first, then alphabetically
          marketOptions.sort((a, b) => {
            if (a.hasCoreJobs && !b.hasCoreJobs) return -1;
            if (!a.hasCoreJobs && b.hasCoreJobs) return 1;
            return a.name.localeCompare(b.name);
          });
          setMarkets(marketOptions);
          // Clear selection when commodity changes
          setSelectedMarket(null);
        }
        
        // Clear search when commodity changes
        setProductSearch("");
        setMarketSearch("");
      } catch (err) {
        console.error("Error fetching products and markets:", err);
      }
    }
    fetchProductsAndMarkets();
  }, [selectedCommodity]);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter markets based on search
  const filteredMarkets = markets.filter((market) =>
    market.name.toLowerCase().includes(marketSearch.toLowerCase())
  );

  // Handle continue to restrictions page - product is optional
  // Navigate to Features Levels page (first view in the product/market analysis flow)
  const handleContinue = () => {
    if (selectedMarket && selectedCommodity) {
      const encodedMarket = encodeURIComponent(selectedMarket.id);
      const encodedMarketName = encodeURIComponent(selectedMarket.name);
      const commodityId = selectedCommodity.commodityId;
      const encodedCommodityName = encodeURIComponent(selectedCommodity.name);
      // Product is optional
      const encodedProduct = selectedProduct ? encodeURIComponent(selectedProduct.name) : "";
      router.push(`/customers/${customerId}/features?market=${encodedMarket}&marketName=${encodedMarketName}&commodityId=${commodityId}&commodityName=${encodedCommodityName}&product=${encodedProduct}`);
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
        {/* Back Button and Title */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/customers" className="text-white hover:text-[var(--accent-primary)] transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-4xl font-medium text-white">Customer {customerName}</h1>
        </div>

        {/* Instruction */}
        <p className="text-base text-white mb-8">
          Select a Product Type and Market to check Product/Market Fit, market needs
        </p>

        {/* Selection Row - Order: Product Type → Product → Market */}
        <div className="flex items-end justify-between gap-4 pb-4 mb-6 border-b-2 border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            {/* Product Type Selector (UNSPSC Commodity) - First */}
            <div className="flex flex-col gap-4 relative">
              <span className="text-label text-[var(--text-labels)] uppercase">Product Type</span>
              <button
                onClick={() => setCommodityDropdownOpen(!commodityDropdownOpen)}
                className="flex items-center justify-between gap-2 min-w-[320px] px-6 py-4 bg-[var(--neutral-lightgray)] rounded-[var(--radius-md)]"
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-6 h-6 text-[var(--text-dark)]" />
                  <span className={`text-2xl font-medium ${selectedCommodity ? "text-[var(--text-dark)]" : "text-[var(--text-dark)] opacity-60"}`}>
                    {selectedCommodity?.name || "Select Product Type"}
                  </span>
                </div>
                <ChevronDown className={`w-6 h-6 text-[var(--text-dark)] transition-transform ${commodityDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {commodityDropdownOpen && (
                <div className="absolute top-full left-0 z-50 w-full mt-2 py-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl max-h-[300px] overflow-auto">
                  {commodities.map((commodity) => (
                    <button
                      key={commodity.id}
                      onClick={() => {
                        setSelectedCommodity(commodity);
                        setCommodityDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-base text-[var(--text-primary)] hover:bg-[var(--secondary-400)] transition-colors"
                    >
                      {commodity.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Arrow Separator */}
            <div className="flex items-center justify-center pb-0 pt-8">
              <ArrowLeftRight className="w-6 h-6 text-[var(--text-primary)]" />
            </div>

            {/* Product Selector - Second, disabled until Product Type selected */}
            <div className="flex flex-col gap-4 relative">
              <span className="text-label text-[var(--text-labels)] uppercase">Product (Optional)</span>
              <button
                onClick={() => selectedCommodity && setProductDropdownOpen(!productDropdownOpen)}
                disabled={!selectedCommodity}
                className={`flex items-center justify-between gap-2 min-w-[320px] px-6 py-4 rounded-[var(--radius-md)] bg-[var(--neutral-lightgray)] ${
                  !selectedCommodity ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-6 h-6 text-[var(--text-dark)]" />
                  <span className={`text-2xl font-medium ${selectedProduct ? "text-[var(--text-dark)]" : "text-[var(--text-dark)] opacity-60"}`}>
                    {selectedProduct?.name || (!selectedCommodity ? "Select Product Type first" : "Select Product")}
                  </span>
                </div>
                <ChevronDown className={`w-6 h-6 text-[var(--text-dark)] transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {productDropdownOpen && selectedCommodity && (
                <div className="absolute top-full left-0 z-50 w-full mt-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl">
                  {/* Search input */}
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
                  {/* Options list */}
                  <div className="max-h-[250px] overflow-auto py-1">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No products found</div>
                    ) : (
                      filteredProducts.map((product, index) => (
                        <button
                          key={`${product.id}-${index}`}
                          onClick={() => {
                            setSelectedProduct(product);
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

            {/* Arrow Separator */}
            <div className="flex items-center justify-center pb-0 pt-8">
              <ArrowLeftRight className="w-6 h-6 text-[var(--text-primary)]" />
            </div>

            {/* Market Selector - Third, disabled until Product Type selected */}
            <div className="flex flex-col gap-4 relative">
              <span className="text-label text-[var(--text-labels)] uppercase">Market</span>
              <button
                onClick={() => selectedCommodity && setMarketDropdownOpen(!marketDropdownOpen)}
                disabled={!selectedCommodity}
                className={`flex items-center justify-between gap-2 min-w-[320px] px-6 py-4 rounded-[var(--radius-md)] bg-[var(--neutral-lightgray)] ${
                  !selectedCommodity ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Store className="w-6 h-6 text-[var(--text-dark)]" />
                  <span className={`text-2xl font-medium ${selectedMarket ? "text-[var(--text-dark)]" : "text-[var(--text-dark)] opacity-60"}`}>
                    {selectedMarket?.name || (!selectedCommodity ? "Select Product Type first" : "Select Market")}
                  </span>
                </div>
                <ChevronDown className={`w-6 h-6 text-[var(--text-dark)] transition-transform ${marketDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {marketDropdownOpen && selectedCommodity && (
                <div className="absolute top-full left-0 z-50 w-full mt-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl">
                  {/* Search input */}
                  <div className="p-2 border-b border-[var(--border-default)]">
                    <input
                      type="text"
                      placeholder="Search markets..."
                      value={marketSearch}
                      onChange={(e) => setMarketSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--surface-page)] text-[var(--text-primary)] rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent-primary)]"
                      autoFocus
                    />
                  </div>
                  {/* Options list - markets with Core Jobs first and selectable, others greyed out */}
                  <div className="max-h-[250px] overflow-auto py-1">
                    {filteredMarkets.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No markets found</div>
                    ) : (
                      filteredMarkets.map((market, index) => (
                        <button
                          key={`${market.id}-${index}`}
                          onClick={() => {
                            if (market.hasCoreJobs) {
                              setSelectedMarket(market);
                              setMarketDropdownOpen(false);
                              setMarketSearch("");
                            }
                          }}
                          disabled={!market.hasCoreJobs}
                          className={`w-full px-4 py-3 text-left text-base transition-colors ${
                            market.hasCoreJobs 
                              ? "text-[var(--text-primary)] hover:bg-[var(--secondary-400)] cursor-pointer" 
                              : "text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span>{market.name}</span>
                          {!market.hasCoreJobs && (
                            <span className="ml-2 text-xs text-[var(--text-muted)]">(No Core Jobs)</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button - requires Product Type and Market (product is optional) */}
          <button
            onClick={handleContinue}
            disabled={!selectedMarket || !selectedCommodity}
            className="px-5 py-4 bg-[var(--accent-primary)] text-[var(--text-dark)] rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>

        {/* Past Sessions Section */}
        <div className="flex flex-col gap-4">
          {/* Search and Sort */}
          <div className="flex items-center gap-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Past Session..."
              className="w-[480px]"
            />
            <SortButton label="Recent" />
          </div>

          <SortedByPill sortBy="Recent" direction="(Newest to older)" />

          {/* Sessions List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
            </div>
          ) : (
            <div className="bg-[var(--surface-default)] rounded-lg overflow-hidden">
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Session row component
function SessionRow({ session }: { session: PastSession }) {
  return (
    <div className="flex gap-4 px-3 py-4 border-b border-[rgba(255,255,255,0.1)] last:border-b-0">
      {/* Date Column */}
      <div className="w-24 border-r border-[var(--border-default)]">
        <p className="text-sm text-[rgba(255,255,255,0.6)]">{session.date}</p>
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Market and Product Tags */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-2">
            <span className="text-label text-[var(--text-labels)] uppercase pl-1">Market</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--neutral-lightgray)] rounded-[var(--radius-md)]">
              <Store className="w-4 h-4 text-[var(--text-dark)]" />
              <span className="text-base font-medium text-[var(--text-dark)]">{session.marketName}</span>
            </div>
          </div>
          
          <div className="flex items-center pt-8">
            <ArrowLeftRight className="w-6 h-6 text-[var(--text-primary)]" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label text-[var(--text-labels)] uppercase pl-1">Product</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--neutral-lightgray)] rounded-[var(--radius-md)]">
              <Box className="w-4 h-4 text-[var(--text-dark)]" />
              <span className="text-base font-medium text-[var(--text-dark)]">{session.productName}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4">
          {/* Updates */}
          <div className="p-3 bg-[var(--surface-page)] rounded-[var(--radius-sm)] min-w-[143px]">
            <p className="text-label text-[var(--neutral-lightgray-700)] mb-4 uppercase">Updates</p>
            <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] mb-2">
              <TrendingUp className="w-4 h-4" />
              Total Updates
            </div>
            <p className="text-2xl font-medium text-white">{session.totalUpdates}</p>
          </div>

          {/* Insights */}
          <div className="flex-1 p-3 bg-[var(--surface-page)] rounded-[var(--radius-sm)]">
            <p className="text-label text-[var(--neutral-lightgray-700)] mb-4 uppercase">
              Insights ({session.insightCount})
            </p>
            <div className="flex gap-4">
              <div className="flex-1 border-r border-[var(--border-default)] pr-4">
                <div className="flex items-center gap-1 text-sm text-[var(--text-primary)] mb-2">
                  <BookOpen className="w-4 h-4" />
                  New Learnings
                </div>
                <p className="text-2xl font-medium text-[var(--accent-primary)]">{session.newLearnings}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm text-[var(--text-primary)] mb-2">
                  <CheckSquare className="w-4 h-4" />
                  Confirmed Assumptions
                </div>
                <p className="text-2xl font-medium text-[var(--accent-primary)]">{session.confirmedAssumptions}</p>
              </div>
            </div>
          </div>

          {/* Latest Insight */}
          <div className="flex-1 p-3 bg-[var(--surface-page)] rounded-[var(--radius-sm)]">
            <p className="text-label text-[var(--neutral-lightgray-700)] mb-4 uppercase">Latest Insight</p>
            <p className="text-sm text-[var(--text-primary)] line-clamp-2">{session.latestInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate sample past sessions
function generateSampleSessions(): PastSession[] {
  const markets = ["Yogurt Cup Filling", "Aerosol Cream Manufacturing", "Milk Bottle Filling"];
  const products = ["DOSOMAT 16", "DOSOMAT 20", "Auger Filler"];
  const insights = [
    "Customer preferences have shifted towards sustainable packaging solutions.",
    "Market research indicates growing demand for plant-based dairy alternatives.",
    "Competitive analysis shows opportunity for higher filling speeds.",
  ];

  return Array.from({ length: 5 }, (_, i) => ({
    id: `session-${i}`,
    date: "yesterday",
    marketId: `market-${i % 3}`,
    marketName: markets[i % 3],
    productId: `product-${i % 3}`,
    productName: products[i % 3],
    totalUpdates: 8,
    insightCount: 30,
    newLearnings: 6,
    confirmedAssumptions: "10/150",
    latestInsight: insights[i % 3],
  }));
}
