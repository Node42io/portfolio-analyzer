import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";
import { MarketOption } from "@/types/customer";

// API route to fetch actual Market nodes from Neo4j
// Returns markets that are served by commodities, including Core Jobs count (direct relationship)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId");
    const companyId = searchParams.get("companyId");

    let query = "";
    let params = {};

    if (commodityId) {
      // Get markets served by a specific commodity, with direct Core Jobs count
      query = `
        MATCH (c:UNSPSCCommodity)-[:COMMODITY_SERVES_MARKET]->(m:Market)
        WHERE c.commodity_id = $commodityId
        OPTIONAL MATCH (m)-[:HAS_CORE_JOB]->(cj:JTBDCoreJob)
        WITH m, count(DISTINCT cj) as coreJobCount
        RETURN DISTINCT
          m.name as id,
          m.name as name,
          m.cpc_code as cpcCode,
          m.description as description,
          coreJobCount as coreJobCount
        ORDER BY coreJobCount DESC, m.name
      `;
      params = { commodityId };
    } else if (companyId) {
      // Get all markets for products of a company, with direct Core Jobs count
      query = `
        MATCH (company:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(c:UNSPSCCommodity)-[:COMMODITY_SERVES_MARKET]->(m:Market)
        WHERE toLower(company.name) CONTAINS toLower($companyId)
        OPTIONAL MATCH (m)-[:HAS_CORE_JOB]->(cj:JTBDCoreJob)
        WITH m, count(DISTINCT cj) as coreJobCount
        RETURN DISTINCT
          m.name as id,
          m.name as name,
          m.cpc_code as cpcCode,
          m.description as description,
          coreJobCount as coreJobCount
        ORDER BY coreJobCount DESC, m.name
      `;
      params = { companyId };
    } else {
      // Get all markets with direct Core Jobs count
      query = `
        MATCH (m:Market)
        OPTIONAL MATCH (m)-[:HAS_CORE_JOB]->(cj:JTBDCoreJob)
        WITH m, count(DISTINCT cj) as coreJobCount
        RETURN DISTINCT
          m.name as id,
          m.name as name,
          m.cpc_code as cpcCode,
          m.description as description,
          coreJobCount as coreJobCount
        ORDER BY coreJobCount DESC, m.name
      `;
    }

    const results = await executeReadQuery<{
      id: string;
      name: string | null;
      cpcCode: string | null;
      description: string | null;
      coreJobCount: number;
    }>(query, params);

    // Transform results to MarketOption interface with hasCoreJobs flag
    const markets: (MarketOption & { hasCoreJobs: boolean; coreJobCount: number })[] = results.map((record) => ({
      id: record.id,
      name: record.name || "Unknown Market",
      cpcCode: record.cpcCode || undefined,
      hasCoreJobs: Number(record.coreJobCount) > 0,
      coreJobCount: Number(record.coreJobCount),
    }));

    return NextResponse.json({ markets });
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets", markets: [] },
      { status: 500 }
    );
  }
}
