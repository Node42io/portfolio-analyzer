// Type definitions for customer and product-market analysis

export type InsightLevel = "HIGH" | "MEDIUM" | "LOW";
export type ConstraintSensitivity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// Customer entity for the customers list
export interface Customer {
  id: string;
  name: string;
  insightLevel: InsightLevel;
  insightCount: number;
  lastUpdate: string;
  totalUpdates: number;
  newLearnings: number;
  confirmedAssumptions: string;
  latestInsight: string;
}

// Product entity linked to a company
export interface Product {
  id: string;
  name: string;
  description?: string;
  commodityId?: string;
}

// Market/Commodity entity for selection
export interface MarketOption {
  id: string;
  name: string;
  cpcCode?: string;
  hasCoreJobs?: boolean;
  coreJobCount?: number;
}

// Past session record for product-market analysis
export interface PastSession {
  id: string;
  date: string;
  marketId: string;
  marketName: string;
  productId: string;
  productName: string;
  totalUpdates: number;
  insightCount: number;
  newLearnings: number;
  confirmedAssumptions: string;
  latestInsight: string;
}

// Constraint category types based on the design
export type ConstraintCategory = 
  | "physics_energy"
  | "space_geometry"
  | "time_throughput"
  | "human_limits"
  | "environment"
  | "rules_liability"
  | "ecosystem_dependencies"
  | "economics";

// Product constraint/restriction
export interface ProductConstraint {
  id: string;
  name: string;
  sensitivity: ConstraintSensitivity;
  description: string;
  category: ConstraintCategory;
  sources?: string;
}

// Grouped constraints by category
export interface ConstraintsByCategory {
  physics_energy: ProductConstraint[];
  space_geometry: ProductConstraint[];
  time_throughput: ProductConstraint[];
  human_limits: ProductConstraint[];
  environment: ProductConstraint[];
  rules_liability: ProductConstraint[];
  ecosystem_dependencies: ProductConstraint[];
  economics: ProductConstraint[];
}

// Constraint category display configuration
export const CONSTRAINT_CATEGORIES: Record<ConstraintCategory, { label: string; key: ConstraintCategory }> = {
  physics_energy: { label: "Physics/Energy", key: "physics_energy" },
  space_geometry: { label: "Space/Geometry", key: "space_geometry" },
  time_throughput: { label: "Time/Throughput", key: "time_throughput" },
  human_limits: { label: "Human Limits", key: "human_limits" },
  environment: { label: "Environment", key: "environment" },
  rules_liability: { label: "Rules & Liability", key: "rules_liability" },
  ecosystem_dependencies: { label: "Ecosystem Dependencies", key: "ecosystem_dependencies" },
  economics: { label: "Economics", key: "economics" },
};

