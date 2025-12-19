import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";
import { Product } from "@/types/customer";

// API route to fetch products from Neo4j
// Can filter by company and/or commodityId using query parameters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const commodityId = searchParams.get("commodityId");

    let query = "";
    let params = {};

    if (commodityId && companyId) {
      // Query to get products for a specific company with a specific commodity classification
      query = `
        MATCH (company:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        WHERE c.commodity_id = $commodityId AND toLower(company.name) CONTAINS toLower($companyId)
        RETURN 
          p.name as name,
          p.company as company,
          p.description as description,
          c.commodity_id as commodityId,
          c.commodity_title as commodityTitle
        ORDER BY p.name
      `;
      params = { commodityId, companyId };
    } else if (commodityId) {
      // Query to get products that have a specific commodity classification
      query = `
        MATCH (p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        WHERE c.commodity_id = $commodityId
        RETURN 
          p.name as name,
          p.company as company,
          p.description as description,
          c.commodity_id as commodityId,
          c.commodity_title as commodityTitle
        ORDER BY p.name
      `;
      params = { commodityId };
    } else if (companyId) {
      // Query to get products for a specific company
      query = `
        MATCH (company:Company)-[:HAS_PRODUCT]->(p:Product)
        WHERE toLower(company.name) CONTAINS toLower($companyId)
        OPTIONAL MATCH (p)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        RETURN 
          p.name as name,
          p.company as company,
          p.description as description,
          c.commodity_id as commodityId,
          c.commodity_title as commodityTitle
        ORDER BY p.name
      `;
      params = { companyId };
    } else {
      // Query to get all products with their commodities
      query = `
        MATCH (p:Product)
        OPTIONAL MATCH (p)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)
        RETURN 
          p.name as name,
          p.company as company,
          p.description as description,
          c.commodity_id as commodityId,
          c.commodity_title as commodityTitle
        ORDER BY p.name
      `;
    }

    const results = await executeReadQuery<{
      name: string;
      company: string | null;
      description: string | null;
      commodityId: string | null;
      commodityTitle: string | null;
    }>(query, params);

    // Transform results to Product interface
    const products: Product[] = results.map((record) => ({
      id: slugify(record.name),
      name: record.name,
      description: record.description || record.commodityTitle || undefined,
      commodityId: record.commodityId || undefined,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", products: [] },
      { status: 500 }
    );
  }
}

// Convert name to URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}
