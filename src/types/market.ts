// Type definitions for market analysis data

export type SeverityLevel = "HIGH" | "MEDIUM" | "LOW";

export type MarketType = 
  | "OVERSERVED"
  | "PARTIALLY_OVERSERVED"
  | "UNDERSERVED"
  | "CONSUMPTION"
  | "NEW_MARKET"
  | "GROWTH";

export interface MarketMetrics {
  tam?: string;
  cagr?: string;
}

export interface MarketCriteria {
  id: number;
  title: string;
  severity: SeverityLevel;
  description: string;
  sources?: string;
}

export interface Market {
  id: string;
  name: string;
  type: MarketType;
  coreJobToBeDone: string;
  description?: string;
  metrics: MarketMetrics;
  criteria: MarketCriteria[];
  commodityId?: string;
  cpcCode?: string;
}

// Raw market data from Neo4j
export interface Neo4jMarketData {
  name: string;
  description: string;
  market_type: string | null;
  core_functional_job: string | null;
  cpc_code: string;
  market_type_high_count: number | null;
  // Criteria ratings and analysis
  cfj_performance_rating: string | null;
  cfj_performance_reasoning: string | null;
  cfj_performance_sources: string | null;
  performance_exceeds_needs_rating: string | null;
  performance_exceeds_needs_analysis: string | null;
  performance_exceeds_needs_sources: string | null;
  willingness_to_pay_declining_rating: string | null;
  willingness_to_pay_declining_analysis: string | null;
  willingness_to_pay_declining_sources: string | null;
  shifting_purchase_criteria_rating: string | null;
  shifting_purchase_criteria_analysis: string | null;
  shifting_purchase_criteria_sources: string | null;
  incumbents_overserving_rating: string | null;
  incumbents_overserving_analysis: string | null;
  incumbents_overserving_sources: string | null;
  new_segments_emerging_rating: string | null;
  new_segments_emerging_analysis: string | null;
  new_segments_emerging_sources: string | null;
  decreasing_differentiation_rating: string | null;
  decreasing_differentiation_analysis: string | null;
  decreasing_differentiation_sources: string | null;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
  disabled?: boolean;
}

export interface SidebarTab {
  id: string;
  label: string;
  isActive?: boolean;
}

// Helper to convert Neo4j market data to our Market interface
export function convertNeo4jMarketToMarket(data: Neo4jMarketData): Market {
  // Parse market type from Neo4j data
  const marketTypeMap: Record<string, MarketType> = {
    "overserved": "OVERSERVED",
    "partially overserved": "PARTIALLY_OVERSERVED",
    "partially_overserved": "PARTIALLY_OVERSERVED",
    "underserved": "UNDERSERVED",
    "consumption": "CONSUMPTION",
    "new market": "NEW_MARKET",
    "new_market": "NEW_MARKET",
    "growth": "GROWTH",
  };

  const marketType = data.market_type 
    ? marketTypeMap[data.market_type.toLowerCase()] || "PARTIALLY_OVERSERVED"
    : "PARTIALLY_OVERSERVED";

  // Build criteria array from the individual rating/analysis fields
  const criteria: MarketCriteria[] = [];

  // 1. Core Functional Job Performance
  if (data.cfj_performance_rating) {
    criteria.push({
      id: 1,
      title: "Core Functional Job Performance",
      severity: parseSeverity(data.cfj_performance_rating),
      description: data.cfj_performance_reasoning || "No analysis available.",
      sources: data.cfj_performance_sources || undefined,
    });
  }

  // 2. Performance Exceeds Customer Needs
  if (data.performance_exceeds_needs_rating) {
    criteria.push({
      id: 2,
      title: "Performance Exceeds Customer Needs",
      severity: parseSeverity(data.performance_exceeds_needs_rating),
      description: data.performance_exceeds_needs_analysis || "No analysis available.",
      sources: data.performance_exceeds_needs_sources || undefined,
    });
  }

  // 3. Customers Less Willing to Pay
  if (data.willingness_to_pay_declining_rating) {
    criteria.push({
      id: 3,
      title: "Customers Less Willing to pay for Performance Improvements",
      severity: parseSeverity(data.willingness_to_pay_declining_rating),
      description: data.willingness_to_pay_declining_analysis || "No analysis available.",
      sources: data.willingness_to_pay_declining_sources || undefined,
    });
  }

  // 4. Shifting Customer Purchasing Criteria
  if (data.shifting_purchase_criteria_rating) {
    criteria.push({
      id: 4,
      title: "Shifting Customer Purchasing Criteria",
      severity: parseSeverity(data.shifting_purchase_criteria_rating),
      description: data.shifting_purchase_criteria_analysis || "No analysis available.",
      sources: data.shifting_purchase_criteria_sources || undefined,
    });
  }

  // 5. Incumbents Overserving the Market
  if (data.incumbents_overserving_rating) {
    criteria.push({
      id: 5,
      title: "Incumbents Overserving the Market",
      severity: parseSeverity(data.incumbents_overserving_rating),
      description: data.incumbents_overserving_analysis || "No analysis available.",
      sources: data.incumbents_overserving_sources || undefined,
    });
  }

  // 6. New Market Segments Emerging
  if (data.new_segments_emerging_rating) {
    criteria.push({
      id: 6,
      title: "New Market Segments Emerging",
      severity: parseSeverity(data.new_segments_emerging_rating),
      description: data.new_segments_emerging_analysis || "No analysis available.",
      sources: data.new_segments_emerging_sources || undefined,
    });
  }

  // 7. Decreasing Differentiation
  if (data.decreasing_differentiation_rating) {
    criteria.push({
      id: 7,
      title: "Decreasing Differentiation",
      severity: parseSeverity(data.decreasing_differentiation_rating),
      description: data.decreasing_differentiation_analysis || "No analysis available.",
      sources: data.decreasing_differentiation_sources || undefined,
    });
  }

  return {
    id: slugify(data.name),
    name: data.name,
    type: marketType,
    coreJobToBeDone: data.core_functional_job || data.description || "No job definition available.",
    description: data.description,
    metrics: {
      tam: undefined, // TAM data not available in schema
      cagr: undefined, // CAGR data not available in schema
    },
    criteria,
    cpcCode: data.cpc_code,
  };
}

// Parse severity rating from string
function parseSeverity(rating: string): SeverityLevel {
  const normalized = rating.toUpperCase().trim();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "MEDIUM") return "MEDIUM";
  return "LOW";
}

// Convert market name to URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}
