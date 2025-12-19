"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { navigationItems } from "@/lib/constants";
import { Market, MarketType } from "@/types/market";
import { ChevronDown, Expand, Search, Grid3X3, List, Loader2 } from "lucide-react";

// Market visualization page with bubble layout and filters
export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [unspscClasses, setUnspscClasses] = useState<{ 
    value: string; 
    label: string;
    classId?: string;
    familyName?: string;
    familyId?: string;
    segmentName?: string;
    segmentId?: string;
  }[]>([]);
  const [groupedClasses, setGroupedClasses] = useState<Record<string, {
    segmentName: string;
    segmentId: string;
    families: Record<string, {
      familyName: string;
      familyId: string;
      classes: Array<{ value: string; label: string; classId: string }>;
    }>;
  }>>({});
  const [commodities, setCommodities] = useState<{ value: string; label: string }[]>([]);
  
  // Filter state
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"explore" | "list">("explore");
  
  // Expanded category state
  const [expandedCategory, setExpandedCategory] = useState<MarketType | null>("PARTIALLY_OVERSERVED");

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch companies
        const companiesRes = await fetch("/api/companies");
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(data.companies || []);
          // Auto-select first company
          if (data.companies?.length > 0) {
            setSelectedCompany(data.companies[0].value);
          }
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    }
    fetchData();
  }, []);

  // Fetch UNSPSC classes when company changes
  useEffect(() => {
    async function fetchClasses() {
      if (!selectedCompany) {
        setUnspscClasses([]);
        setGroupedClasses({});
        return;
      }
      try {
        const res = await fetch(`/api/unspsc/classes?companyName=${encodeURIComponent(selectedCompany)}`);
        if (res.ok) {
          const data = await res.json();
          setUnspscClasses(data.classes || []);
          setGroupedClasses(data.grouped || {});
          setSelectedClass(null);
          setCommodities([]);
          setSelectedCommodity(null);
        }
      } catch (err) {
        console.error("Error fetching UNSPSC classes:", err);
      }
    }
    fetchClasses();
  }, [selectedCompany]);

  // Fetch commodities when class changes
  useEffect(() => {
    async function fetchCommodities() {
      if (!selectedCompany || !selectedClass) return;
      try {
        const params = new URLSearchParams({
          companyName: selectedCompany,
          className: selectedClass,
        });
        const res = await fetch(`/api/unspsc/commodities?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCommodities(data.commodities || []);
          setSelectedCommodity(null);
        }
      } catch (err) {
        console.error("Error fetching commodities:", err);
      }
    }
    fetchCommodities();
  }, [selectedCompany, selectedClass]);

  // Fetch markets based on filters
  useEffect(() => {
    async function fetchMarkets() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCompany) params.append("companyName", selectedCompany);
        if (selectedClass) params.append("className", selectedClass);
        if (selectedCommodity) params.append("commodityName", selectedCommodity);
        
        const res = await fetch(`/api/markets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMarkets(data.markets || []);
        }
      } catch (err) {
        console.error("Error fetching markets:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
  }, [selectedCompany, selectedClass, selectedCommodity]);

  // Group markets by type
  const groupedMarkets = useMemo(() => {
    const filtered = markets.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const groups: Record<MarketType, Market[]> = {
      OVERSERVED: [],
      PARTIALLY_OVERSERVED: [],
      UNDERSERVED: [],
      CONSUMPTION: [],
      NEW_MARKET: [],
      GROWTH: [],
    };
    
    filtered.forEach(market => {
      if (groups[market.type]) {
        groups[market.type].push(market);
      } else {
        groups.PARTIALLY_OVERSERVED.push(market);
      }
    });
    
    return groups;
  }, [markets, searchQuery]);

  // Get display names
  const companyName = companies.find(c => c.value === selectedCompany)?.label || selectedCompany || "Company";
  const className = unspscClasses.find(c => c.value === selectedClass)?.label || selectedClass || "";
  const commodityName = commodities.find(c => c.value === selectedCommodity)?.label || selectedCommodity || "";

  // Build title
  const pageTitle = `${companyName}${className ? ` — ${className}` : ""}${commodityName ? ` / ${commodityName}` : ""} Markets`;

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <Header 
        navigationItems={navigationItems.map(item => ({ 
          ...item, 
          isActive: item.id === "markets" 
        }))}
        companyName={companyName}
        divisionName={className || "All Products"}
      />

      <main className="pt-24 px-6 max-w-[1512px] mx-auto pb-16">
        {/* Title Section with Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Company Filter */}
            <FilterDropdown
              label="Company"
              options={companies}
              value={selectedCompany}
              onChange={setSelectedCompany}
              placeholder="Select Company"
            />
            
            {/* UNSPSC Class Filter with Segment/Family grouping */}
            <GroupedFilterDropdown
              label="UNSPSC Class"
              options={unspscClasses}
              grouped={groupedClasses}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="All Classes"
              disabled={!selectedCompany}
            />
            
            {/* Commodity Filter */}
            <FilterDropdown
              label="Commodity"
              options={commodities}
              value={selectedCommodity}
              onChange={setSelectedCommodity}
              placeholder="All Commodities"
              disabled={!selectedClass}
            />
          </div>
          
          <h1 className="text-2xl font-medium text-white mb-2">{pageTitle}</h1>
          <p className="text-base text-[#b9b9b9]">
            Explore the markets where {companyName} is active.
            Markets are sorted by <span className="underline">Phase</span> and{" "}
            <span className="underline">Size</span>, with highlighted segments showing where innovation is most needed.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="border border-[rgba(255,255,255,0.2)] bg-[rgba(72,72,72,0.05)] backdrop-blur-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 text-[#fdff98] animate-spin" />
            </div>
          ) : (
            <div className="flex">
              {/* Market Categories */}
              <div className="flex-1 p-6 min-h-[700px]">
                {/* Category Labels and Content */}
                {(["OVERSERVED", "PARTIALLY_OVERSERVED", "CONSUMPTION", "UNDERSERVED"] as MarketType[]).map((type) => (
                  <MarketCategory
                    key={type}
                    type={type}
                    markets={groupedMarkets[type]}
                    isExpanded={expandedCategory === type}
                    onToggle={() => setExpandedCategory(expandedCategory === type ? null : type)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                ))}
                
                {/* Axis Labels */}
                <div className="mt-4 flex items-end justify-between">
                  <div className="text-xs text-[#bebebe]">
                    <p className="capitalize">Market Size (Number of Beneficiaries)</p>
                    <p>from LOW to HIGH</p>
                  </div>
                </div>
              </div>
              
              {/* Innovation Types Sidebar */}
              <InnovationSidebar />
            </div>
          )}
        </div>
        
        {/* Y-Axis Label */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-[#bebebe] whitespace-nowrap">
          Market Phase
        </div>
      </main>
    </div>
  );
}

// Filter dropdown component with search functionality
interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
}

function FilterDropdown({ label, options, value, onChange, placeholder, disabled }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const selectedOption = options.find(o => o.value === value);
  
  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!filterQuery.trim()) return options;
    const query = filterQuery.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }, [options, filterQuery]);

  // Reset search when dropdown closes
  const handleClose = () => {
    setIsOpen(false);
    setFilterQuery("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.2)] 
          bg-[rgba(72,72,72,0.05)] backdrop-blur-sm text-sm
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[rgba(255,255,255,0.4)] cursor-pointer"}
        `}
      >
        <span className="text-[#fdff98] font-medium">{label}:</span>
        <span className="text-white truncate max-w-[150px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-[#b9b9b9]" />
      </button>
      
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[280px] border border-[rgba(255,255,255,0.2)] bg-[#1a1a1b] backdrop-blur-sm">
            {/* Search input */}
            <div className="p-2 border-b border-[rgba(255,255,255,0.1)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b9b9b9]" />
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#fdff98] rounded"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Options list */}
            <div className="max-h-[250px] overflow-y-auto">
              <button
                onClick={() => { onChange(null); handleClose(); }}
                className="w-full px-4 py-2 text-left text-sm text-[#b9b9b9] hover:bg-[rgba(255,255,255,0.1)]"
              >
                {placeholder}
              </button>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[#666] text-center">
                  No results found
                </div>
              ) : (
                filteredOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { onChange(option.value); handleClose(); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.1)] ${
                      option.value === value ? "text-[#fdff98] bg-[rgba(253,255,152,0.1)]" : "text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
            
            {/* Results count */}
            {filterQuery && (
              <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.1)] text-xs text-[#666]">
                {filteredOptions.length} of {options.length} results
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Grouped filter dropdown for UNSPSC classes with segment/family headers
interface GroupedFilterDropdownProps {
  label: string;
  options: { value: string; label: string; classId?: string; familyName?: string; segmentName?: string }[];
  grouped: Record<string, {
    segmentName: string;
    segmentId: string;
    families: Record<string, {
      familyName: string;
      familyId: string;
      classes: Array<{ value: string; label: string; classId: string }>;
    }>;
  }>;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
}

function GroupedFilterDropdown({ label, options, grouped, value, onChange, placeholder, disabled }: GroupedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const selectedOption = options.find(o => o.value === value);

  // Filter options and build filtered grouped structure
  const { filteredOptions, filteredGrouped } = useMemo(() => {
    if (!filterQuery.trim()) {
      return { filteredOptions: options, filteredGrouped: grouped };
    }
    
    const query = filterQuery.toLowerCase();
    const filtered = options.filter(opt => opt.label.toLowerCase().includes(query));
    
    // Rebuild grouped structure with only matching classes
    const newGrouped: typeof grouped = {};
    for (const [segKey, segment] of Object.entries(grouped)) {
      const newFamilies: typeof segment.families = {};
      
      for (const [famKey, family] of Object.entries(segment.families)) {
        const matchingClasses = family.classes.filter(cls => 
          cls.label.toLowerCase().includes(query)
        );
        
        if (matchingClasses.length > 0) {
          newFamilies[famKey] = { ...family, classes: matchingClasses };
        }
      }
      
      if (Object.keys(newFamilies).length > 0) {
        newGrouped[segKey] = { ...segment, families: newFamilies };
      }
    }
    
    return { filteredOptions: filtered, filteredGrouped: newGrouped };
  }, [options, grouped, filterQuery]);

  const handleClose = () => {
    setIsOpen(false);
    setFilterQuery("");
  };

  // Sort segments by ID
  const sortedSegments = Object.entries(filteredGrouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.2)] 
          bg-[rgba(72,72,72,0.05)] backdrop-blur-sm text-sm
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[rgba(255,255,255,0.4)] cursor-pointer"}
        `}
      >
        <span className="text-[#fdff98] font-medium">{label}:</span>
        <span className="text-white truncate max-w-[150px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-[#b9b9b9]" />
      </button>
      
      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[350px] max-w-[450px] border border-[rgba(255,255,255,0.2)] bg-[#1a1a1b] backdrop-blur-sm">
            {/* Search input */}
            <div className="p-2 border-b border-[rgba(255,255,255,0.1)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b9b9b9]" />
                <input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#fdff98] rounded"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Grouped options list */}
            <div className="max-h-[350px] overflow-y-auto">
              <button
                onClick={() => { onChange(null); handleClose(); }}
                className="w-full px-4 py-2 text-left text-sm text-[#b9b9b9] hover:bg-[rgba(255,255,255,0.1)]"
              >
                {placeholder}
              </button>
              
              {sortedSegments.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[#666] text-center">
                  No results found
                </div>
              ) : (
                sortedSegments.map(([segKey, segment]) => {
                  const sortedFamilies = Object.entries(segment.families).sort(([a], [b]) => a.localeCompare(b));
                  
                  return (
                    <div key={segKey} className="border-t border-[rgba(255,255,255,0.05)]">
                      {/* Segment Header */}
                      <div className="px-3 py-2 bg-[rgba(253,255,152,0.1)] border-l-2 border-[#fdff98]">
                        <span className="text-xs font-mono text-[#fdff98] uppercase tracking-wide">
                          {segment.segmentId ? `${segment.segmentId} — ` : ""}{segment.segmentName}
                        </span>
                      </div>
                      
                      {sortedFamilies.map(([famKey, family]) => {
                        const sortedClasses = [...family.classes].sort((a, b) => 
                          (a.classId || "").localeCompare(b.classId || "")
                        );
                        
                        return (
                          <div key={famKey}>
                            {/* Family Header */}
                            <div className="px-4 py-1.5 bg-[rgba(255,255,255,0.03)]">
                              <span className="text-xs text-[#b9b9b9]">
                                {family.familyId ? `${family.familyId} — ` : ""}{family.familyName}
                              </span>
                            </div>
                            
                            {/* Classes */}
                            {sortedClasses.map(cls => (
                              <button
                                key={cls.value}
                                onClick={() => { onChange(cls.value); handleClose(); }}
                                className={`w-full px-6 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.1)] flex items-center gap-2 ${
                                  cls.value === value ? "text-[#fdff98] bg-[rgba(253,255,152,0.1)]" : "text-white"
                                }`}
                              >
                                {cls.classId && (
                                  <span className="text-xs font-mono text-[#666] min-w-[50px]">{cls.classId}</span>
                                )}
                                <span>{cls.label}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Results count */}
            {filterQuery && (
              <div className="px-3 py-2 border-t border-[rgba(255,255,255,0.1)] text-xs text-[#666]">
                {filteredOptions.length} of {options.length} results
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Market category row component
interface MarketCategoryProps {
  type: MarketType;
  markets: Market[];
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "explore" | "list";
  onViewModeChange: (mode: "explore" | "list") => void;
}

function MarketCategory({ 
  type, 
  markets, 
  isExpanded, 
  onToggle,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: MarketCategoryProps) {
  const typeLabels: Record<MarketType, string> = {
    OVERSERVED: "OVERSERVED",
    PARTIALLY_OVERSERVED: "PARTIALLY\nOVERSERVED",
    UNDERSERVED: "UNDERSERVED",
    CONSUMPTION: "PARTIALLY\nUNDERSERVED",
    NEW_MARKET: "NEW MARKET",
    GROWTH: "GROWTH",
  };

  const displayedMarkets = isExpanded ? markets : markets.slice(0, 7);
  const remainingCount = markets.length - 7;

  return (
    <div className={`
      bg-[rgba(17,19,22,0.5)] backdrop-blur-[50px] mb-3 p-3
      ${isExpanded ? "min-h-[400px]" : "h-[140px]"}
      transition-all duration-300
    `}>
      <div className="flex h-full">
        {/* Category Label */}
        <div className="w-[150px] shrink-0 flex flex-col justify-between h-full">
          <div>
            <p className="font-mono text-lg text-[#e0e0e0] uppercase whitespace-pre-line leading-tight">
              {typeLabels[type]}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-[#3c465a] text-[#fdff98] font-mono text-xs px-1.5 py-0.5 rounded-full">
                {markets.length}
              </span>
              <span className="font-mono text-xs text-[#e0e0e0] uppercase">Markets</span>
            </div>
          </div>
          
          {/* Legend (only show when expanded) */}
          {isExpanded && type === "PARTIALLY_OVERSERVED" && (
            <div className="mt-auto text-[10px] text-[#b9b9b9] space-y-1">
              <p className="font-mono text-[8px] uppercase mb-2">LEGEND</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#fdff98]" />
                <span>Market Share Size</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-[#3c465a] px-1">10</span>
                <span>N° of product types</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] bg-[#3c465a] px-1">2%</span>
                <span>Product/Market Fit</span>
              </div>
            </div>
          )}
        </div>

        {/* Market Bubbles Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Search and View Toggle (only show when expanded) */}
          {isExpanded && (
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b9b9b9]" />
                <input
                  type="text"
                  placeholder="Search for a Market..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-[rgba(255,255,255,0.2)] text-sm text-white placeholder:text-[#b9b9b9] focus:outline-none focus:border-[#fdff98]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewModeChange("explore")}
                  className={`flex items-center gap-1 px-3 py-1 text-xs ${
                    viewMode === "explore" ? "bg-[rgba(255,255,255,0.1)] text-white" : "text-[#b9b9b9]"
                  }`}
                >
                  Explore mode <Grid3X3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`flex items-center gap-1 px-3 py-1 text-xs ${
                    viewMode === "list" ? "bg-[rgba(255,255,255,0.1)] text-white" : "text-[#b9b9b9]"
                  }`}
                >
                  List View <List className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Markets Display */}
          {viewMode === "explore" || !isExpanded ? (
            <div className="relative h-full flex flex-wrap items-end gap-2 content-end">
              {!isExpanded && remainingCount > 0 && (
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-xs text-[#cdcdcd] uppercase">
                  Other {remainingCount} markets
                </span>
              )}
              {displayedMarkets.map((market, idx) => (
                <MarketBubble 
                  key={market.id} 
                  market={market}
                  size={getBubbleSize(idx, markets.length)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[350px]">
              {markets.map(market => (
                <MarketListItem key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggle}
          className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#767676] ml-2 self-start"
        >
          <Expand className="w-4 h-4 text-[#767676]" />
        </button>
      </div>
    </div>
  );
}

// Market bubble component
interface MarketBubbleProps {
  market: Market;
  size: number;
}

function MarketBubble({ market, size }: MarketBubbleProps) {
  return (
    <Link href={`/markets/${market.id}`} className="group relative">
      {/* Bubble */}
      <div 
        className="rounded-full bg-[#fdff98] transition-transform group-hover:scale-110"
        style={{ width: size, height: size }}
      />
      
      {/* Market Tag */}
      <div className="absolute left-[calc(100%+8px)] top-1/2 z-10 bg-[rgba(23,24,33,0.6)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.2)] px-3 py-2 min-w-[120px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-sm text-white mb-1">{market.name}</p>
        <div className="flex items-center gap-3 text-[10px] text-[#b9b9b9]">
          <span className="font-mono bg-[#3c465a] px-1">{Math.floor(Math.random() * 50 + 10)}</span>
          <span className="font-mono bg-[#3c465a] px-1">{Math.floor(Math.random() * 60 + 10)}%</span>
        </div>
      </div>
    </Link>
  );
}

// Market list item component
function MarketListItem({ market }: { market: Market }) {
  return (
    <Link 
      href={`/markets/${market.id}`}
      className="flex items-center justify-between p-3 bg-[rgba(23,24,33,0.6)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.2)] hover:border-[#fdff98] transition-colors"
    >
      <div>
        <p className="text-sm text-white">{market.name}</p>
        <div className="flex items-center gap-3 text-[10px] text-[#b9b9b9] mt-1">
          <span className="font-mono bg-[#3c465a] px-1">{Math.floor(Math.random() * 50 + 10)}</span>
          <span className="font-mono bg-[#3c465a] px-1">{Math.floor(Math.random() * 60 + 10)}%</span>
        </div>
      </div>
    </Link>
  );
}

// Innovation sidebar component
function InnovationSidebar() {
  const innovationTypes = [
    {
      label: "SUGGESTED INNOVATION AREA",
      types: ["Usability", "Customization", "Reliability", "Convenience", "Affordability", "Disruption Potential"],
      row: "OVERSERVED",
    },
    {
      label: "",
      types: ["Usability", "Customization", "Reliability", "Convenience"],
      row: "PARTIALLY_OVERSERVED",
    },
    {
      label: "",
      types: ["Product", "Service"],
      row: "UNDERSERVED",
    },
  ];

  return (
    <div className="w-[250px] border-l border-[rgba(255,255,255,0.2)] p-4">
      <p className="font-mono text-sm text-[#bbbc90] uppercase mb-4">Innovation Types:</p>
      
      {innovationTypes.map((section, idx) => (
        <div key={idx} className="mb-8">
          {section.label && (
            <p className="font-medium text-xs text-[#bbbc90] uppercase mb-2 text-right">
              {section.label}
            </p>
          )}
          <div className="text-sm text-[#eaeaea] leading-relaxed">
            {section.types.map((type, i) => (
              <p key={i}>{type}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper to determine bubble size
function getBubbleSize(index: number, total: number): number {
  const sizes = [52, 48, 45, 42, 38, 34, 26, 24, 18];
  return sizes[index % sizes.length] || 24;
}

