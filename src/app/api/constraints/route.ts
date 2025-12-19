import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";
import { ProductConstraint, ConstraintCategory, ConstraintSensitivity } from "@/types/customer";

// API route to fetch commodity constraints from Neo4j
// Retrieves CommodityConstraint nodes linked to UNSPSCCommodity
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId");
    const productName = searchParams.get("productName");

    let query = "";
    let params = {};

    if (productName) {
      // Get constraints for commodities linked to this product
      query = `
        MATCH (p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(commodity:UNSPSCCommodity)
        WHERE toLower(p.name) CONTAINS toLower($productName)
        MATCH (commodity)-[:HAS_CONSTRAINT]->(c:CommodityConstraint)
        RETURN 
          c.name as name,
          c.description as description,
          c.impact_severity as severity,
          c.category as category,
          commodity.commodity_id as commodityId,
          commodity.commodity_title as commodityTitle
        ORDER BY c.category, c.impact_severity DESC, c.name
      `;
      params = { productName };
    } else if (commodityId) {
      // Get constraints for a specific commodity
      query = `
        MATCH (commodity:UNSPSCCommodity)-[:HAS_CONSTRAINT]->(c:CommodityConstraint)
        WHERE commodity.commodity_id = $commodityId
        RETURN 
          c.name as name,
          c.description as description,
          c.impact_severity as severity,
          c.category as category,
          commodity.commodity_id as commodityId,
          commodity.commodity_title as commodityTitle
        ORDER BY c.category, c.impact_severity DESC, c.name
      `;
      params = { commodityId };
    } else {
      // Get all constraints (limited)
      query = `
        MATCH (commodity:UNSPSCCommodity)-[:HAS_CONSTRAINT]->(c:CommodityConstraint)
        RETURN 
          c.name as name,
          c.description as description,
          c.impact_severity as severity,
          c.category as category,
          commodity.commodity_id as commodityId,
          commodity.commodity_title as commodityTitle
        ORDER BY c.category, c.impact_severity DESC, c.name
        LIMIT 200
      `;
    }

    const results = await executeReadQuery<{
      name: string;
      description: string | null;
      severity: string | null;
      category: string | null;
      commodityId: string | null;
      commodityTitle: string | null;
    }>(query, params);

    // Transform results to ProductConstraint interface
    const constraints: ProductConstraint[] = results.map((record, index) => ({
      id: `constraint-${index}`,
      name: record.name,
      sensitivity: mapSeverity(record.severity),
      description: record.description || "No description available.",
      category: mapCategory(record.category),
      sources: record.commodityTitle || undefined,
    }));

    return NextResponse.json({ constraints });
  } catch (error) {
    console.error("Error fetching constraints:", error);
    return NextResponse.json(
      { error: "Failed to fetch constraints", constraints: [] },
      { status: 500 }
    );
  }
}

// Map severity string from Neo4j to ConstraintSensitivity type
function mapSeverity(severity: string | null): ConstraintSensitivity {
  if (!severity) return "MEDIUM";
  const upper = severity.toUpperCase();
  if (upper === "CRITICAL") return "CRITICAL";
  if (upper === "HIGH") return "HIGH";
  if (upper === "LOW") return "LOW";
  return "MEDIUM";
}

// Map category string from Neo4j to ConstraintCategory type
function mapCategory(category: string | null): ConstraintCategory {
  if (!category) return "physics_energy";
  const normalized = category.toLowerCase().replace(/[\/\s&]+/g, "_");
  
  const categoryMap: Record<string, ConstraintCategory> = {
    "physics_energy": "physics_energy",
    "physics": "physics_energy",
    "energy": "physics_energy",
    "space_geometry": "space_geometry",
    "space": "space_geometry",
    "geometry": "space_geometry",
    "time_throughput": "time_throughput",
    "time": "time_throughput",
    "throughput": "time_throughput",
    "human_limits": "human_limits",
    "human": "human_limits",
    "environment": "environment",
    "rules_liability": "rules_liability",
    "rules": "rules_liability",
    "liability": "rules_liability",
    "ecosystem_dependencies": "ecosystem_dependencies",
    "ecosystem": "ecosystem_dependencies",
    "dependencies": "ecosystem_dependencies",
    "economics": "economics",
  };

  return categoryMap[normalized] || "physics_energy";
}

