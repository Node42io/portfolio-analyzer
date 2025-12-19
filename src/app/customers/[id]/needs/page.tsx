"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { PillTabs } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { Product } from "@/types/customer";
import { 
  ArrowLeft, Store, ArrowLeftRight, ChevronDown, 
  Mic, Loader2, LayoutGrid
} from "lucide-react";

// Map customer IDs to display names
const customerNames: Record<string, string> = {
  "danone": "Danone",
  "rugenwalder": "Rügenwalder Mühle",
  "bechtel": "Privatmolkerei Bechtel",
};

// Job category with associated jobs
interface JobCategory {
  name: string;
  bullets: string[];
  jobs: Array<{ name: string; statement: string; description: string }>;
  count: number;
}

// Market Needs page - displays product-specific jobs categorized by lifecycle stage
export default function MarketNeedsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = params.id as string;
  const customerName = customerNames[customerId] || customerId;
  
  // Read values from URL params
  const marketName = searchParams.get("marketName") || "";
  const commodityId = searchParams.get("commodityId") || "23181501";
  const commodityName = searchParams.get("commodityName") || "";
  const initialProduct = searchParams.get("product") || "";

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("needs");
  const [activeTab, setActiveTab] = useState<"universal" | "product">("product");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProduct);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Core functional job (mock - would come from API)
  const coreJob = "Enable accurate and efficient filling operations with minimal product waste and maximum uptime";

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

  // Fetch product jobs
  useEffect(() => {
    async function fetchProductJobs() {
      try {
        const response = await fetch(`/api/product-jobs?commodityId=${commodityId}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Error fetching product jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProductJobs();
  }, [commodityId]);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Get selected category data
  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  // View switcher tabs
  const viewTabs = [
    { id: "features", label: "Features Levels" },
    { id: "needs", label: "Market Needs" },
    { id: "restrictions", label: "Product Restrictions" },
    { id: "fit", label: "Product/Market fit" },
  ];

  // Handle view change - navigate to different pages
  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    const navParams = new URLSearchParams();
    if (marketName) navParams.set("marketName", marketName);
    if (commodityId) navParams.set("commodityId", commodityId);
    if (commodityName) navParams.set("commodityName", commodityName);
    if (selectedProduct) navParams.set("product", selectedProduct);
    
    router.push(`/customers/${customerId}/${viewId}?${navParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#16181c]">
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
      <main className="pt-24 px-8 max-w-[1512px] mx-auto pb-16">
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-4">
          {/* Back Button and Title */}
          <div className="flex items-center gap-2">
            <Link 
              href={`/customers/${customerId}`} 
              className="text-white hover:text-[#fdff98] transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-[34px] font-medium text-[#f3f1eb]">Customer {customerName}</h1>
          </div>

          {/* Selection Row with View Tabs */}
          <div className="flex items-end justify-between pb-4 border-b-2 border-[#262b33]">
            {/* Market and Product Display */}
            <div className="flex items-center gap-2">
              {/* Market Display - Fixed */}
              <div className="flex flex-col gap-2">
                <span className="text-[16px] font-mono text-[#7b7a79] uppercase pl-1">Market</span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#bfbdb9] rounded-2xl">
                  <Store className="w-4 h-4 text-[#262b33]" />
                  <span className="text-[16px] font-medium text-[#262b33]">
                    {marketName ? decodeURIComponent(marketName) : "—"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#262b33]" />
                </div>
              </div>

              {/* Arrow Separator */}
              <div className="flex items-center pt-8">
                <ArrowLeftRight className="w-6 h-6 text-[#f3f1eb]" />
              </div>

              {/* Product Selector */}
              <div className="flex flex-col gap-2 relative">
                <span className="text-[16px] font-mono text-[#7b7a79] uppercase pl-1">Product</span>
                <button
                  onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#bfbdb9] rounded-2xl hover:opacity-90 transition-opacity"
                >
                  <LayoutGrid className="w-4 h-4 text-[#262b33]" />
                  <span className="text-[16px] font-medium text-[#262b33]">
                    {selectedProduct ? decodeURIComponent(selectedProduct) : "Select Product"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#262b33] transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {/* Product Dropdown */}
                {productDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 w-[280px] mt-2 bg-[#1b1e23] border border-[#262b33] rounded-lg shadow-xl">
                    <div className="p-2 border-b border-[#262b33]">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-[#16181c] text-[#f3f1eb] rounded-lg border border-[#262b33] focus:outline-none focus:border-[#fdff98]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[250px] overflow-auto py-1">
                      {filteredProducts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[#7b7a79]">No products found</div>
                      ) : (
                        filteredProducts.map((product, index) => (
                          <button
                            key={`${product.id}-${index}`}
                            onClick={() => {
                              setSelectedProduct(product.name);
                              setProductDropdownOpen(false);
                              setProductSearch("");
                            }}
                            className="w-full px-4 py-3 text-left text-base text-[#f3f1eb] hover:bg-[#4f5358] transition-colors"
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
              <button className="flex items-center gap-1 px-4 py-1 bg-[#fdff98] text-[#262b33] rounded-full font-normal hover:opacity-90 transition-opacity h-[45px]">
                <Mic className="w-4 h-4" />
                Record Session
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-4">
            {/* Left Section - Title and Description */}
            <div className="flex flex-col gap-4 w-[612px]">
              <h2 className="text-[24px] font-medium text-[#f3f1eb]">Market Needs</h2>
              <p className="text-[16px] text-[#f3f1eb]">
                Market needs are specific to the product lifecycle. Each category represents a different phase of customer interaction with the product.
              </p>
            </div>

            {/* Right Section - Core Functional Job */}
            <div className="flex-1 bg-[#1b1e23] rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <span className="text-[16px] font-mono text-[#7b7a79] uppercase">Core Functional Job</span>
                <p className="text-[16px] text-[#f3f1eb]">{coreJob}</p>
              </div>
            </div>
          </div>

          {/* Needs Type Tabs */}
          <div className="flex h-[42px]">
            <button
              onClick={() => setActiveTab("universal")}
              className={`px-4 flex items-center justify-center border-b transition-colors ${
                activeTab === "universal"
                  ? "border-b-2 border-[#fdff98] text-[#fdff98]"
                  : "border-b border-[#4f5358] text-[#f3f1eb]"
              }`}
            >
              <span className="text-[20px] font-medium">Universal Market Needs</span>
            </button>
            <button
              onClick={() => setActiveTab("product")}
              className={`px-4 flex items-center justify-center border-b transition-colors ${
                activeTab === "product"
                  ? "border-b-2 border-[#fdff98] text-[#fdff98]"
                  : "border-b border-[#4f5358] text-[#f3f1eb]"
              }`}
            >
              <span className="text-[20px] font-medium">Product Specific Needs</span>
            </button>
          </div>

          {activeTab === "product" && (
            <p className="text-[16px] text-white">Specific to the Product solution</p>
          )}
        </div>

        {/* Category Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Category Grid - 5 cards in a row */}
            <div className="flex gap-2">
              {categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  category={category}
                  isSelected={selectedCategory === category.name}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )}
                />
              ))}
            </div>

            {/* Expanded Category Section */}
            {selectedCategory && selectedCategoryData && (
              <div className="bg-[#1f2329] rounded-xl p-4 flex flex-col gap-6">
                <h3 className="text-[20px] font-medium text-[#fdff98]">
                  {selectedCategoryData.name}
                </h3>
                
                {/* Job Cards Grid - show up to 5 per row */}
                <div className="flex gap-4 flex-wrap">
                  {selectedCategoryData.jobs.slice(0, 6).map((job, index) => (
                    <MarketNeedCard key={index} job={job} />
                  ))}
                </div>
                
                {selectedCategoryData.jobs.length > 6 && (
                  <p className="text-[14px] text-[#7b7a79]">
                    And {selectedCategoryData.jobs.length - 6} more needs...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Category card component - matches Figma design exactly
function CategoryCard({ 
  category, 
  isSelected,
  onClick 
}: { 
  category: JobCategory; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col justify-between h-[239px] px-3 py-4 rounded-lg transition-all ${
        isSelected 
          ? "bg-[#1f2329] border border-[#fdff98]" 
          : "bg-[#1f2329] border border-transparent hover:border-[#262b33]"
      }`}
    >
      {/* Top Section - Title and Bullets */}
      <div className="flex flex-col gap-4 pb-4 border-b border-[#262b33]">
        <h3 className="text-[20px] font-medium text-[#f3f1eb] text-left">{category.name}</h3>
        <ul className="text-[14px] text-[#f3f1eb] list-disc list-inside text-left leading-relaxed">
          {category.bullets.map((bullet, index) => (
            <li key={index} className="mb-0.5">{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Bottom Section - Market Needs count */}
      <div className="flex items-center gap-2">
        <span className="text-[20px] text-[#7b7a79]">Market Needs</span>
        <span className="px-2 py-1 bg-[#4f5358] rounded-full text-[14px] font-mono text-[#fdff98]">
          {category.count}
        </span>
      </div>
    </button>
  );
}

// Market Need Card component - matches Figma design exactly
function MarketNeedCard({ job }: { job: { name: string; statement: string; description: string } }) {
  // Truncate description for display
  const truncatedDesc = job.statement 
    ? (job.statement.length > 100 ? job.statement.substring(0, 100) + "..." : job.statement)
    : (job.description?.length > 100 ? job.description.substring(0, 100) + "..." : job.description || "");

  return (
    <div className="w-[265px] bg-[#181a1e] rounded-lg p-2">
      <div className="flex flex-col gap-4 h-[150px]">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-mono text-[#7b7a79] uppercase">Market Need</span>
          <p className="text-[16px] text-[#f3f1eb]">{job.name}</p>
          <p className="text-[12px] text-[#b8b6b1] leading-normal">
            {truncatedDesc}
          </p>
        </div>
        
        {/* KPI Section - Separator and details */}
        <div className="pt-3 border-t border-[#2a2f38] mt-auto">
          <span className="text-[12px] font-mono text-[#7b7a79] uppercase">KPI: Performance</span>
          <p className="text-[14px] text-[#f3f1eb] mt-1">
            Unit: metric
          </p>
        </div>
      </div>
    </div>
  );
}
