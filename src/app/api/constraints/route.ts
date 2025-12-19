import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Interface for Constraint data from Neo4j
interface ConstraintData {
  name: string;
  description: string | null;
  category: string | null;
  impact_severity: string | null;
}

// Severity order for sorting (Critical first, then High, then Medium, then Low)
const SEVERITY_ORDER: Record<string, number> = {
  "Critical": 1,
  "CRITICAL": 1,
  "High": 2,
  "HIGH": 2,
  "Medium": 3,
  "MEDIUM": 3,
  "Low": 4,
  "LOW": 4,
};

// Map database category names to frontend keys
const CATEGORY_MAP: Record<string, string> = {
  "Physics/Energy": "physics_energy",
  "Space/Geometry": "space_geometry",
  "Time/Throughput": "time_throughput",
  "Human Limits": "human_limits",
  "Environment": "environment",
  "Rules & Liability": "rules_liability",
  "Ecosystem Dependencies": "ecosystem_dependencies",
  "Economics": "economics",
};

// API route to fetch Constraints for a commodity grouped by severity
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId");

    if (!commodityId) {
      return NextResponse.json(
        { error: "commodityId is required" },
        { status: 400 }
      );
    }

    console.log("Fetching constraints for commodity:", commodityId);

    let constraints: ConstraintData[] = [];

    // Fetch Constraints for this commodity
    try {
      const constraintsQuery = `
        MATCH (c:UNSPSCCommodity {commodity_id: $commodityId})-[:HAS_CONSTRAINT]->(con:CommodityConstraint)
        RETURN con.name as name, con.description as description, 
               con.category as category, con.impact_severity as impact_severity
        ORDER BY con.impact_severity, con.category, con.name
      `;
      constraints = await executeReadQuery<ConstraintData>(constraintsQuery, { commodityId });
      console.log(`Found ${constraints.length} constraints`);
    } catch (err) {
      console.error("Error fetching constraints:", err);
    }

    // Sort constraints by severity order
    constraints.sort((a, b) => {
      const severityA = SEVERITY_ORDER[a.impact_severity || "Medium"] || 99;
      const severityB = SEVERITY_ORDER[b.impact_severity || "Medium"] || 99;
      return severityA - severityB;
    });

    // Group constraints by severity
    const constraintsBySeverity: Record<string, Array<{
      name: string;
      description: string;
      category: string;
    }>> = {
      "Critical": [],
      "High": [],
      "Medium": [],
      "Low": [],
    };

    for (const con of constraints) {
      const severity = con.impact_severity || "Medium";
      if (!constraintsBySeverity[severity]) {
        constraintsBySeverity[severity] = [];
      }
      constraintsBySeverity[severity].push({
        name: con.name,
        description: con.description || "",
        category: con.category || "",
      });
    }

    // Count constraints per severity
    const severityCounts: Record<string, number> = {};
    for (const severity of Object.keys(SEVERITY_ORDER)) {
      severityCounts[severity] = constraintsBySeverity[severity]?.length || 0;
    }

    // Get all constraints as flat list (sorted by severity)
    const allConstraints = constraints.map(con => ({
      name: con.name,
      description: con.description || "",
      category: con.category || "",
      severity: con.impact_severity || "Medium",
    }));

    // Also group by category with severity sorting
    const constraintsByCategory: Record<string, Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      sensitivity: string;
    }>> = {};
    
    for (const con of constraints) {
      const category = con.category || "Other";
      if (!constraintsByCategory[category]) {
        constraintsByCategory[category] = [];
      }
      constraintsByCategory[category].push({
        id: `${category}-${con.name}`.replace(/\s+/g, '-').toLowerCase(),
        name: con.name,
        description: con.description || "",
        category: category,
        sensitivity: (con.impact_severity || "Medium").toUpperCase(),
      });
    }
    
    // Sort each category by severity
    for (const category of Object.keys(constraintsByCategory)) {
      constraintsByCategory[category].sort((a, b) => {
        const severityA = SEVERITY_ORDER[a.sensitivity] || SEVERITY_ORDER[a.sensitivity.charAt(0).toUpperCase() + a.sensitivity.slice(1).toLowerCase()] || 99;
        const severityB = SEVERITY_ORDER[b.sensitivity] || SEVERITY_ORDER[b.sensitivity.charAt(0).toUpperCase() + b.sensitivity.slice(1).toLowerCase()] || 99;
        return severityA - severityB;
      });
    }

    // Create flat constraints list for the page (sorted by severity within each category)
    // Map database categories to frontend keys
    const constraintsFlat = constraints.map(con => {
      const dbCategory = con.category || "Other";
      const frontendCategory = CATEGORY_MAP[dbCategory] || dbCategory.toLowerCase().replace(/[\/\s&]+/g, '_');
      return {
        id: `${frontendCategory}-${con.name}`.replace(/\s+/g, '-').toLowerCase(),
        name: con.name,
        description: con.description || "",
        category: frontendCategory,
        sensitivity: (con.impact_severity || "Medium").toUpperCase(),
      };
    });
    
    // Sort constraintsFlat by severity
    constraintsFlat.sort((a, b) => {
      const severityA = SEVERITY_ORDER[a.sensitivity] || 99;
      const severityB = SEVERITY_ORDER[b.sensitivity] || 99;
      return severityA - severityB;
    });

    return NextResponse.json({
      constraintsBySeverity,
      constraintsByCategory,
      constraints: constraintsFlat,
      severityCounts,
      allConstraints,
      totalConstraints: constraints.length,
      severities: ["Critical", "High", "Medium", "Low"],
    });
  } catch (error) {
    console.error("Error fetching constraints:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch constraints",
        constraintsBySeverity: {},
        severityCounts: {},
        allConstraints: [],
        totalConstraints: 0,
        severities: ["Critical", "High", "Medium", "Low"],
      },
      { status: 500 }
    );
  }
}
