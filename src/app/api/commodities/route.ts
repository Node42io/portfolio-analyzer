import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Commodity type for UNSPSC Product Types
interface CommodityOption {
  id: string;
  name: string;
  commodityId: string;
}

// API route to fetch UNSPSC Commodities (Product Types) from Neo4j
// Returns commodities linked to products for the company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const productName = searchParams.get("productName");

    let query = "";
    let params = {};

    if (productName) {
      // Get commodity for a specific product
      query = `
        MATCH (p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        WHERE toLower(p.name) CONTAINS toLower($productName)
        RETURN DISTINCT
          c.commodity_id as commodityId,
          c.commodity_title as name
        ORDER BY c.commodity_title
        LIMIT 50
      `;
      params = { productName };
    } else if (companyId) {
      // Get all commodities for products of a company
      query = `
        MATCH (company:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        WHERE toLower(company.name) CONTAINS toLower($companyId)
        RETURN DISTINCT
          c.commodity_id as commodityId,
          c.commodity_title as name
        ORDER BY c.commodity_title
        LIMIT 50
      `;
      params = { companyId };
    } else {
      // Get all commodities that have constraints (most useful for analysis)
      query = `
        MATCH (c:UNSPSCCommodity)-[:HAS_CONSTRAINT]->(constraint:CommodityConstraint)
        RETURN DISTINCT
          c.commodity_id as commodityId,
          c.commodity_title as name
        ORDER BY c.commodity_title
        LIMIT 50
      `;
    }

    const results = await executeReadQuery<{
      commodityId: string;
      name: string | null;
    }>(query, params);

    // Transform results to CommodityOption interface
    const commodities: CommodityOption[] = results.map((record) => ({
      id: record.commodityId,
      name: record.name || `Commodity ${record.commodityId}`,
      commodityId: record.commodityId,
    }));

    return NextResponse.json({ commodities });
  } catch (error) {
    console.error("Error fetching commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities", commodities: [] },
      { status: 500 }
    );
  }
}

