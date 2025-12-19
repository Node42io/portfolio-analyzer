"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { PillTabs, RecordingOverlay, RecordButton } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { Product } from "@/types/customer";
import { 
  ArrowLeft, Store, ArrowLeftRight, ChevronDown, 
  Loader2, LayoutGrid, Target, Mic
} from "lucide-react";

// Map customer IDs to display names
const customerNames: Record<string, string> = {
  "bechtel": "Privatmolkerei Bechtel",
  "welfen-gymnasium": "Welfen Gymnasium",
};

// Step with error statements (market needs)
interface JobStep {
  order: number;
  name: string;
  description: string;
  errorStatements: Array<{
    statement: string;
    category: string;
    impact: string;
    kpiName: string;
    kpiUnit: string;
    relatedCoreJobs?: string[];
  }>;
  needsCount: number;
}

// Product Job interface
interface ProductJob {
  name: string;
  statement: string;
  description: string;
  level: string;
  useContext: string;
  userGroup: string;
  frequency: string;
}

// Core Job interface
interface CoreJob {
  name: string;
  statement: string;
  description: string;
  errorStatements: Array<{
    statement: string;
    category: string;
    kpiName: string;
    kpiUnit: string;
  }>;
}

// Market Needs page - displays job map steps with error statements as market needs
export default function MarketNeedsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const customerId = params.id as string;
  const customerName = customerNames[customerId] || customerId;
  
  // Read values from URL params
  const marketName = searchParams.get("marketName") || "";
  const commodityId = searchParams.get("commodityId") || "23181501";
  const commodityName = searchParams.get("commodityName") || "";
  const initialProduct = searchParams.get("product") || "";

  const [steps, setSteps] = useState<JobStep[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("needs");
  const [activeTab, setActiveTab] = useState<"job-steps" | "product-specific" | "core-market">("core-market");
  const [selectedStepOrder, setSelectedStepOrder] = useState<number | null>(1); // Default to first step
  const [coreFunctionalJob, setCoreFunctionalJob] = useState("");
  
  // Product Jobs state
  const [productJobs, setProductJobs] = useState<Record<string, ProductJob[]>>({});
  const [productJobCategories] = useState(["Acquisition", "Preparation", "Usage", "Maintenance", "Disposal"]);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("Usage");
  const [productJobsLoading, setProductJobsLoading] = useState(true);
  
  // Core Jobs state
  const [coreJobs, setCoreJobs] = useState<Record<string, CoreJob[]>>({});
  const [coreJobCategories] = useState(["Control", "Process", "Efficiency", "Problem-Solving"]);
  const [selectedCoreCategory, setSelectedCoreCategory] = useState<string>("Control");
  const [coreJobsLoading, setCoreJobsLoading] = useState(true);
  
  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProduct);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  
  // Recording state for live transcript
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  // Fetch job steps with error statements
  useEffect(() => {
    async function fetchJobSteps() {
      try {
        const response = await fetch(`/api/core-jobs?marketName=${encodeURIComponent(marketName)}&commodityId=${commodityId}`);
        if (response.ok) {
          const data = await response.json();
          setSteps(data.steps || []);
          setCoreFunctionalJob(data.coreFunctionalJob || "");
          // Also set core jobs from this response
          setCoreJobs(data.coreJobs || {});
          setCoreJobsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching job steps:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobSteps();
  }, [marketName, commodityId]);

  // Fetch product jobs for this commodity
  useEffect(() => {
    async function fetchProductJobs() {
      if (!commodityId) return;
      try {
        const response = await fetch(`/api/product-jobs?commodityId=${commodityId}`);
        if (response.ok) {
          const data = await response.json();
          setProductJobs(data.jobsByCategory || {});
        }
      } catch (err) {
        console.error("Error fetching product jobs:", err);
      } finally {
        setProductJobsLoading(false);
      }
    }
    fetchProductJobs();
  }, [commodityId]);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Get selected step data
  const selectedStep = steps.find(s => s.order === selectedStepOrder);
  
  // Calculate total needs count
  const totalNeedsCount = steps.reduce((sum, step) => sum + step.needsCount, 0);

  // View switcher tabs
  const viewTabs = [
    { id: "features", label: "Features Levels" },
    { id: "needs", label: "Market Needs" },
    { id: "restrictions", label: "Product Restrictions" },
    { id: "fit", label: "Product/Market fit", disabled: true },
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
            {/* Product Type, Market and Product Display */}
            <div className="flex items-center gap-2">
              {/* Product Type Display */}
              <div className="flex flex-col gap-2">
                <span className="text-[16px] font-mono text-[#7b7a79] uppercase pl-1">Product Type</span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#262b33] rounded-2xl border border-[#4f5358]">
                  <LayoutGrid className="w-4 h-4 text-[#bfbdb9]" />
                  <span className="text-[16px] font-medium text-[#bfbdb9]">
                    {commodityName ? decodeURIComponent(commodityName) : "—"}
                  </span>
                </div>
              </div>

              {/* Arrow Separator */}
              <div className="flex items-center pt-8">
                <ArrowLeftRight className="w-6 h-6 text-[#f3f1eb]" />
              </div>

              {/* Market Display */}
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
              <RecordButton 
                isRecording={isRecording} 
                onClick={() => {
                  setIsRecording(!isRecording);
                  setIsPaused(false);
                }} 
              />
            </div>
          </div>
        </div>

        {/* Content Section - Title, Description, Core Job */}
        <div className="flex gap-4 mb-4">
          {/* Left Section - Title and Description - changes based on active tab */}
          <div className="flex flex-col gap-4 w-[612px]">
            <h2 className="text-[24px] font-medium text-[#f3f1eb]">
              {activeTab === "core-market" && "Core Market Needs"}
              {activeTab === "job-steps" && "Job Steps"}
              {activeTab === "product-specific" && "Product Specific Needs"}
            </h2>
            <p className="text-[16px] text-[#f3f1eb]">
              {activeTab === "core-market" && "Market needs represent imperfections in the job map - things that can go wrong when customers try to accomplish their goals."}
              {activeTab === "job-steps" && "Job steps represent the sequential phases customers go through to accomplish their core functional job."}
              {activeTab === "product-specific" && "Product specific needs are jobs that come with the solution - tasks required to acquire, use, and maintain the product."}
            </p>
          </div>

          {/* Right Section - Core Functional Job */}
          <div className="flex-1 bg-[#1b1e23] rounded-lg p-4">
            <div className="flex flex-col gap-3">
              <span className="text-[16px] font-mono text-[#7b7a79] uppercase">Core Functional Job</span>
              <p className="text-[16px] text-[#f3f1eb]">
                {coreFunctionalJob || "Enable accurate and efficient operations with minimal waste and maximum uptime"}
              </p>
            </div>
          </div>
        </div>

        {/* Needs Type Tabs - Core Market Needs, Job Steps, Product Specific Needs */}
        <div className="flex border-b border-[#262b33] mb-4">
          <button
            onClick={() => setActiveTab("core-market")}
            className={`px-4 h-[42px] flex items-center justify-center transition-colors ${
              activeTab === "core-market"
                ? "border-b-2 border-[#fdff98] text-[#fdff98]"
                : "border-b border-[#4f5358] text-[#f3f1eb]"
            }`}
          >
            <span className="text-[20px] font-medium">Core Market Needs</span>
          </button>
          <button
            onClick={() => setActiveTab("job-steps")}
            className={`px-4 h-[42px] flex items-center justify-center transition-colors ${
              activeTab === "job-steps"
                ? "border-b-2 border-[#fdff98] text-[#fdff98]"
                : "border-b border-[#4f5358] text-[#f3f1eb]"
            }`}
          >
            <span className="text-[20px] font-medium">Job Steps</span>
          </button>
          <button
            onClick={() => setActiveTab("product-specific")}
            className={`px-4 h-[42px] flex items-center justify-center transition-colors ${
              activeTab === "product-specific"
                ? "border-b-2 border-[#fdff98] text-[#fdff98]"
                : "border-b border-[#4f5358] text-[#f3f1eb]"
            }`}
          >
            <span className="text-[20px] font-medium">Product Specific Needs</span>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-[16px] text-white mb-8">Independent of Specific Product Solutions</p>

        {/* TAB CONTENT - Job Steps */}
        {activeTab === "job-steps" && (
          loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Single scrollable container for step numbers and cards */}
              <div className="overflow-x-auto pb-4" ref={scrollContainerRef}>
                <div className="inline-flex flex-col">
                  {/* Step number row with connecting line */}
                  <div className="relative flex mb-3">
                    {/* Continuous line behind all badges */}
                    <div 
                      className="absolute top-1/2 h-[1px] bg-[#4f5358]" 
                      style={{ 
                        left: `${150}px`, 
                        right: `${150}px`
                      }} 
                    />
                    
                    {/* Step badges - aligned with card centers */}
                    {steps.map((step, index) => (
                      <div 
                        key={step.order} 
                        className="flex items-center justify-center shrink-0"
                        style={{ width: '300px', marginRight: index < steps.length - 1 ? '8px' : '0' }}
                      >
                        <button
                          onClick={() => setSelectedStepOrder(selectedStepOrder === step.order ? null : step.order)}
                          className={`w-[44px] h-[32px] flex items-center justify-center rounded-full font-mono text-[16px] transition-colors shrink-0 relative z-10 ${
                            selectedStepOrder === step.order
                              ? "bg-[#fdff98] text-[#262b33]"
                              : "bg-[#262b33] text-white hover:bg-[#3c465a]"
                          }`}
                        >
                          {step.order}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Step cards row */}
                  <div className="flex gap-2">
                    {steps.map((step) => (
                      <div key={step.order} className="shrink-0 w-[300px]">
                        <StepCard
                          step={step}
                          isSelected={selectedStepOrder === step.order}
                          onClick={() => setSelectedStepOrder(selectedStepOrder === step.order ? null : step.order)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Step Header with Needs Count */}
              {selectedStep && (
                <div className="flex items-center gap-4 mt-4">
                  {/* Step Badge and Title */}
                  <div className="flex items-center gap-3">
                    <div className="w-[44px] h-[32px] flex items-center justify-center rounded-full bg-[#262b33] font-mono text-[16px] text-white">
                      {selectedStep.order}
                    </div>
                    <span className="text-[20px] font-medium text-[#f3f1eb]">{selectedStep.name}</span>
                  </div>
                  
                  {/* Market Needs Count */}
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-mono text-[#8a8f98] uppercase">Error Statements</span>
                    <span className="px-2 py-1 bg-[#3c465a] rounded-full text-[14px] font-mono text-[#fdff98]">
                      {selectedStep.needsCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Expanded Market Needs Section */}
              {selectedStep && selectedStep.errorStatements.length > 0 && (
                <div className="flex flex-col gap-4 mt-2">
                  {selectedStep.errorStatements.map((error, index) => (
                    <MarketNeedCard key={index} error={error} />
                  ))}
                </div>
              )}

              {/* Empty state when step selected but no needs */}
              {selectedStep && selectedStep.errorStatements.length === 0 && (
                <div className="bg-[#1f2329] rounded-lg p-6 mt-2">
                  <p className="text-[16px] text-[#7b7a79]">
                    No error statements identified for this step yet.
                  </p>
                </div>
              )}
            </div>
          )
        )}

        {/* TAB CONTENT - Product Specific Needs */}
        {activeTab === "product-specific" && (
          productJobsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Category Pills */}
              <div className="flex gap-2 flex-wrap">
                {productJobCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedProductCategory(category)}
                    className={`px-4 py-2 rounded-full text-[14px] font-mono transition-colors ${
                      selectedProductCategory === category
                        ? "bg-[#fdff98] text-[#262b33]"
                        : "bg-[#262b33] text-[#f3f1eb] hover:bg-[#3c465a]"
                    }`}
                  >
                    {category}
                    <span className="ml-2 text-[12px] opacity-70">
                      ({productJobs[category]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>

              {/* Product Jobs List */}
              <div className="flex flex-col gap-4">
                {(productJobs[selectedProductCategory] || []).length === 0 ? (
                  <div className="bg-[#1f2329] rounded-lg p-6">
                    <p className="text-[16px] text-[#7b7a79]">
                      No product jobs found for {selectedProductCategory}.
                    </p>
                  </div>
                ) : (
                  (productJobs[selectedProductCategory] || []).map((job, index) => (
                    <ProductJobCard key={index} job={job} />
                  ))
                )}
              </div>
            </div>
          )
        )}

        {/* TAB CONTENT - Core Market Needs */}
        {activeTab === "core-market" && (
          coreJobsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Category Pills */}
              <div className="flex gap-2 flex-wrap">
                {coreJobCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCoreCategory(category)}
                    className={`px-4 py-2 rounded-full text-[14px] font-mono transition-colors ${
                      selectedCoreCategory === category
                        ? "bg-[#fdff98] text-[#262b33]"
                        : "bg-[#262b33] text-[#f3f1eb] hover:bg-[#3c465a]"
                    }`}
                  >
                    {category}
                    <span className="ml-2 text-[12px] opacity-70">
                      ({coreJobs[category]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>

              {/* Core Jobs List */}
              <div className="flex flex-col gap-4">
                {(coreJobs[selectedCoreCategory] || []).length === 0 ? (
                  <div className="bg-[#1f2329] rounded-lg p-6">
                    <p className="text-[16px] text-[#7b7a79]">
                      No core jobs found for {selectedCoreCategory}.
                    </p>
                  </div>
                ) : (
                  (coreJobs[selectedCoreCategory] || []).map((job, index) => (
                    <CoreJobCard key={index} job={job} />
                  ))
                )}
              </div>
            </div>
          )
        )}
      </main>
      
      {/* Live Transcript Recording Overlay */}
      <RecordingOverlay 
        isRecording={isRecording}
        onStop={() => {
          setIsRecording(false);
          setIsPaused(false);
        }}
        onPause={() => setIsPaused(!isPaused)}
        isPaused={isPaused}
      />
    </div>
  );
}

// Step Card component - matches Figma design with title, description, and needs count
function StepCard({ 
  step, 
  isSelected,
  onClick 
}: { 
  step: JobStep; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-[211px] flex flex-col justify-between px-3 py-4 rounded-lg transition-all overflow-hidden ${
        isSelected 
          ? "bg-[#1f2329] border border-[#fdff98]" 
          : "bg-[#1f2329] border border-transparent hover:border-[#262b33]"
      }`}
    >
      {/* Top Section - Title and Description */}
      <div className="flex flex-col gap-2 pb-3 border-b border-[#262b33] overflow-hidden flex-1 min-h-0">
        <h3 className="text-[18px] font-medium text-[#f3f1eb] text-left line-clamp-2">{step.name}</h3>
        <p className="text-[14px] text-[#bfbdb9] text-left leading-relaxed line-clamp-4 overflow-hidden">
          {step.description}
        </p>
      </div>

      {/* Bottom Section - Market Needs count */}
      <div className="flex items-center gap-2 pt-2 shrink-0">
        <span className="text-[14px] font-mono text-[#8a8f98] uppercase">Needs</span>
        <span className="px-2 py-1 bg-[#3c465a] rounded-full text-[12px] font-mono text-[#fdff98]">
          {step.needsCount}
        </span>
      </div>
    </button>
  );
}

// Market Need Card component - displays error statement with KPI
function MarketNeedCard({ 
  error 
}: { 
  error: { 
    statement: string; 
    category: string; 
    impact: string; 
    kpiName: string; 
    kpiUnit: string; 
    relatedCoreJobs?: string[];
  } 
}) {
  return (
    <div className="w-full bg-[#1f2329] rounded-lg px-3 py-4 flex gap-8">
      {/* Left Section - Category and Statement */}
      <div className="flex flex-col gap-4 flex-1 max-w-[714px]">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-[#3c465a] rounded text-[12px] font-mono text-[#fdff98] uppercase">
            {error.category || "General"}
          </span>
        </div>
        <p className="text-[16px] text-[#f3f1eb] leading-relaxed">
          {error.statement}
        </p>
        {/* Related Core Jobs */}
        {error.relatedCoreJobs && error.relatedCoreJobs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[12px] font-mono text-[#7b7a79] uppercase">Impacts:</span>
            {error.relatedCoreJobs.map((job, index) => (
              <span key={index} className="text-[12px] text-[#bfbdb9] bg-[#262b33] px-2 py-1 rounded">
                {job}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right Section - KPI */}
      <div className="flex items-start gap-8 shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#7b7a79]" />
          <span className="text-[16px] font-mono text-[#7b7a79] uppercase">KPI</span>
        </div>
        <div className="flex flex-col gap-2 min-w-[200px]">
          <span className="text-[16px] font-medium text-[#f3f1eb]">
            {error.kpiName || "—"}
          </span>
          <span className="text-[14px] text-[#8a8f98]">
            {error.kpiUnit || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Product Job Card component - displays product job details
function ProductJobCard({ job }: { job: ProductJob }) {
  return (
    <div className="w-full bg-[#1f2329] rounded-lg px-4 py-4 flex flex-col gap-3">
      {/* Job Name */}
      <h3 className="text-[18px] font-medium text-[#f3f1eb]">{job.name}</h3>
      
      {/* Statement */}
      <p className="text-[16px] text-[#bfbdb9] leading-relaxed">
        {job.statement}
      </p>
      
      {/* Metadata Row */}
      <div className="flex flex-wrap gap-4 mt-2">
        {job.userGroup && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-[#7b7a79] uppercase">User:</span>
            <span className="text-[14px] text-[#f3f1eb] bg-[#262b33] px-2 py-1 rounded">
              {job.userGroup}
            </span>
          </div>
        )}
        {job.frequency && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-[#7b7a79] uppercase">Frequency:</span>
            <span className="text-[14px] text-[#f3f1eb] bg-[#262b33] px-2 py-1 rounded">
              {job.frequency}
            </span>
          </div>
        )}
        {job.level && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-[#7b7a79] uppercase">Level:</span>
            <span className="text-[14px] text-[#f3f1eb] bg-[#262b33] px-2 py-1 rounded">
              {job.level}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Core Job Card component - displays core job details with expandable error statements
function CoreJobCard({ job }: { job: CoreJob }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasErrors = job.errorStatements && job.errorStatements.length > 0;
  
  return (
    <div className="w-full bg-[#1f2329] rounded-lg px-4 py-4 flex flex-col gap-3">
      {/* Header with Job Name and Error Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-medium text-[#f3f1eb]">{job.name}</h3>
        {hasErrors && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[14px] font-mono text-[#fdff98] hover:opacity-80 transition-opacity"
          >
            <span className="px-2 py-1 bg-[#3c465a] rounded-full">
              {job.errorStatements.length} Need{job.errorStatements.length !== 1 ? 's' : ''}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Statement */}
      <p className="text-[16px] text-[#bfbdb9] leading-relaxed">
        {job.statement}
      </p>
      
      {/* Description if available */}
      {job.description && (
        <p className="text-[14px] text-[#7b7a79] italic">
          {job.description}
        </p>
      )}
      
      {/* Expandable Needs Section */}
      {isExpanded && hasErrors && (
        <div className="mt-4 pt-4 border-t border-[#262b33] flex flex-col gap-3">
          <span className="text-[14px] font-mono text-[#8a8f98] uppercase">Related Needs</span>
          {job.errorStatements.map((error, index) => (
            <div key={index} className="bg-[#262b33] rounded-lg px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-[#3c465a] rounded text-[11px] font-mono text-[#fdff98] uppercase">
                  {error.category}
                </span>
              </div>
              <p className="text-[14px] text-[#f3f1eb] leading-relaxed">
                {error.statement}
              </p>
              {(error.kpiName || error.kpiUnit) && (
                <div className="flex items-center gap-4 text-[12px] text-[#7b7a79]">
                  <span className="font-mono uppercase">KPI:</span>
                  <span className="text-[#bfbdb9]">{error.kpiName} {error.kpiUnit && `(${error.kpiUnit})`}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
