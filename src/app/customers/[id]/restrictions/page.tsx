"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout";
import { SeverityBadge, PillTabs, TabNavigation } from "@/components/ui";
import { navigationItems } from "@/lib/constants";
import { ProductConstraint, ConstraintCategory, CONSTRAINT_CATEGORIES } from "@/types/customer";
import { ArrowLeft, Store, Box, ArrowLeftRight, LayoutGrid, ChevronDown, Mic, Loader2, AlertCircle, X } from "lucide-react";
import { Product } from "@/types/customer";

// Map customer IDs to display names
const customerNames: Record<string, string> = {
  "danone": "Danone",
  "rugenwalder": "Rügenwalder Mühle",
  "bechtel": "Privatmolkerei Bechtel",
};

// Product Restrictions page - displays constraints table for a product/market combination
export default function RestrictionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const customerName = customerNames[customerId] || customerId;
  
  // Read fixed values from URL params
  const marketName = searchParams.get("marketName") || "";
  const commodityId = searchParams.get("commodityId") || "";
  const commodityName = searchParams.get("commodityName") || "";
  const initialProductId = searchParams.get("product") || "";

  const [constraints, setConstraints] = useState<ProductConstraint[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("restrictions");
  const [activeCategory, setActiveCategory] = useState<ConstraintCategory>("physics_energy");
  
  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProductId);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

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

  // Fetch constraints from API using commodity ID (preferred) or product name
  useEffect(() => {
    async function fetchConstraints() {
      try {
        // Build query params - prefer commodityId for accurate results
        const queryParams = new URLSearchParams();
        if (commodityId) {
          // Use commodity ID directly for constraints lookup
          queryParams.set("commodityId", commodityId);
        } else if (selectedProduct) {
          // Fallback to product name lookup
          queryParams.set("productName", decodeURIComponent(selectedProduct).replace(/-/g, " "));
        }

        const response = await fetch(`/api/constraints?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.constraints && data.constraints.length > 0) {
            setConstraints(data.constraints);
          } else {
            // No constraints found for this product/market
            setConstraints([]);
          }
        } else {
          setConstraints([]);
        }
      } catch (err) {
        console.error("Error fetching constraints:", err);
        setConstraints([]);
      } finally {
        setLoading(false);
      }
    }
    fetchConstraints();
  }, [commodityId, selectedProduct]);

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Group constraints by category
  const constraintsByCategory = constraints.reduce((acc, constraint) => {
    if (!acc[constraint.category]) {
      acc[constraint.category] = [];
    }
    acc[constraint.category].push(constraint);
    return acc;
  }, {} as Record<ConstraintCategory, ProductConstraint[]>);

  // Category tabs with counts
  const categoryTabs = Object.entries(CONSTRAINT_CATEGORIES).map(([key, value]) => ({
    id: key,
    label: value.label,
    count: constraintsByCategory[key as ConstraintCategory]?.length || 0,
  }));

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
    const params = new URLSearchParams();
    if (marketName) params.set("marketName", marketName);
    if (commodityId) params.set("commodityId", commodityId);
    if (commodityName) params.set("commodityName", commodityName);
    if (selectedProduct) params.set("product", selectedProduct);
    
    if (viewId === "features") {
      window.location.href = `/customers/${customerId}/features?${params.toString()}`;
    } else if (viewId === "needs") {
      window.location.href = `/customers/${customerId}/needs?${params.toString()}`;
    }
  };

  // Get current category constraints
  const currentConstraints = constraintsByCategory[activeCategory] || [];
  const totalConstraints = constraints.length;

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
              {/* Market Display - Fixed, greyed out */}
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

              {/* Product Type Display - Fixed, greyed out */}
              <div className="flex flex-col gap-2 opacity-50">
                <span className="text-label text-[var(--text-labels)] uppercase pl-1">Product Type</span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-disabled)] rounded-[var(--radius-md)] cursor-not-allowed">
                  <LayoutGrid className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-base font-medium text-[var(--text-muted)]">
                    {commodityName ? decodeURIComponent(commodityName) : "—"}
                  </span>
                </div>
              </div>

              {/* Arrow Separator */}
              <div className="flex items-center pt-8">
                <ArrowLeftRight className="w-6 h-6 text-[var(--text-primary)]" />
              </div>

              {/* Product Selector - Dropdown with X button to clear */}
              <div className="flex flex-col gap-2 relative">
                <span className="text-label text-[var(--text-labels)] uppercase pl-1">Product</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className="flex items-center justify-between gap-2 min-w-[280px] px-3 py-2 bg-[var(--neutral-lightgray)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-[var(--text-dark)]" />
                      <span className={`text-base font-medium ${selectedProduct ? "text-[var(--text-dark)]" : "text-[var(--text-dark)] opacity-60"}`}>
                        {selectedProduct ? decodeURIComponent(selectedProduct) : "Select Product"}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-dark)] transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {/* X button to clear product */}
                  {selectedProduct && (
                    <button
                      onClick={() => setSelectedProduct("")}
                      className="p-1.5 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--secondary-400)] transition-colors"
                      title="Clear product selection"
                    >
                      <X className="w-4 h-4 text-[var(--text-primary)]" />
                    </button>
                  )}
                </div>
                {/* Product Dropdown */}
                {productDropdownOpen && (
                  <div className="absolute top-full left-0 z-50 w-[280px] mt-2 bg-[var(--surface-default)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-xl">
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
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-medium text-white">Product Restrictions</h2>
            <span className="flex items-center justify-center px-2 h-4 bg-[var(--secondary-400)] rounded-full text-sm text-[var(--accent-primary)]">
              {totalConstraints}
            </span>
          </div>
          <p className="text-base text-white">Description</p>
        </div>

        {/* Category Tabs */}
        <TabNavigation
          tabs={categoryTabs}
          activeTab={activeCategory}
          onTabChange={(id) => setActiveCategory(id as ConstraintCategory)}
          className="mb-6"
        />

        {/* Constraints Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : (
          <div className="bg-[var(--secondary-700)] border border-[var(--border-default)] overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center bg-[var(--secondary-700)] border-b border-[var(--border-default)]">
              <div className="w-[385px] px-4 py-2">
                <span className="text-label text-[var(--text-labels)] uppercase">Name</span>
              </div>
              <div className="w-[109px] px-2 py-2 border-l border-[var(--border-default)]">
                <span className="text-label text-[var(--text-labels)] uppercase">Sensitivity</span>
              </div>
              <div className="flex-1 px-2 py-2 border-l border-[var(--border-default)]">
                <span className="text-label text-[var(--text-labels)] uppercase">Description</span>
              </div>
            </div>

            {/* Table Body */}
            {currentConstraints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] gap-2">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p>No constraints found for this category.</p>
              </div>
            ) : (
              currentConstraints.map((constraint) => (
                <ConstraintRow key={constraint.id} constraint={constraint} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Constraint table row component
function ConstraintRow({ constraint }: { constraint: ProductConstraint }) {
  return (
    <div className="flex items-stretch min-h-[102px] border-b border-[var(--border-default)] last:border-b-0">
      {/* Name Column */}
      <div className="w-[385px] px-4 py-4">
        <p className="text-sm text-[var(--text-primary)]">{constraint.name}</p>
      </div>

      {/* Sensitivity Column */}
      <div className="w-[109px] px-2 py-4 border-l border-[var(--border-default)]">
        <SeverityBadge 
          severity={constraint.sensitivity} 
          showIcon={constraint.sensitivity === "CRITICAL"}
        />
      </div>

      {/* Description Column */}
      <div className="flex-1 px-2 py-4 border-l border-[var(--border-default)]">
        <p className="text-sm text-[var(--text-primary)]">{constraint.description}</p>
      </div>
    </div>
  );
}


