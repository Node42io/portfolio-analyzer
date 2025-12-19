import { NextRequest, NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// GET /api/unspsc/commodities - Fetch UNSPSC commodities for a company and optional class
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyName = searchParams.get("companyName");
    const className = searchParams.get("className");

    if (!companyName) {
      return NextResponse.json({ commodities: [] });
    }

    let query: string;
    let params: Record<string, unknown> = { companyName };

    if (className) {
      // Fetch commodities for company filtered by class using correct relationships
      // Path: Company -> HAS_PRODUCT -> Product -> HAS_UNSPSC_CLASSIFICATION -> UNSPSCCommodity
      //       <- HAS_COMMODITY <- UNSPSCClass
      query = `
        MATCH (c:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(com:UNSPSCCommodity)
        WHERE c.name = $companyName
        MATCH (cls:UNSPSCClass)-[:HAS_COMMODITY]->(com)
        WHERE cls.class_title = $className
        RETURN DISTINCT com.commodity_title AS name, com.commodity_id AS commodityId
        ORDER BY com.commodity_id ASC
      `;
      params.className = className;
    } else {
      // Fetch all commodities for company
      query = `
        MATCH (c:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(com:UNSPSCCommodity)
        WHERE c.name = $companyName
        RETURN DISTINCT com.commodity_title AS name, com.commodity_id AS commodityId
        ORDER BY com.commodity_id ASC
      `;
    }

    const results = await executeReadQuery<{ name: string; commodityId: string }>(query, params);
    
    const commodities = results
      .filter(r => r.name) // Filter out null values
      .map(r => ({
        value: r.name,
        label: r.name,
        commodityId: r.commodityId || "",
      }));

    return NextResponse.json({ commodities });
  } catch (error) {
    console.error("Error fetching UNSPSC commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch UNSPSC commodities" },
      { status: 500 }
    );
  }
}
