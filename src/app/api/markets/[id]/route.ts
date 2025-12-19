import { NextRequest, NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";
import { Neo4jMarketData, convertNeo4jMarketToMarket } from "@/types/market";

// GET /api/markets/[id] - Fetch a single market by name (slug)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Convert slug back to search pattern (replace hyphens with spaces for matching)
    const searchPattern = id.replace(/-/g, " ");

    const query = `
      MATCH (m:Market)
      WHERE toLower(m.name) CONTAINS toLower($searchPattern)
         OR toLower(replace(m.name, ' ', '-')) = toLower($id)
      RETURN m.name AS name,
             m.description AS description,
             m.market_type AS market_type,
             m.core_functional_job AS core_functional_job,
             m.cpc_code AS cpc_code,
             m.market_type_high_count AS market_type_high_count,
             m.cfj_performance_rating AS cfj_performance_rating,
             m.cfj_performance_reasoning AS cfj_performance_reasoning,
             m.cfj_performance_sources AS cfj_performance_sources,
             m.performance_exceeds_needs_rating AS performance_exceeds_needs_rating,
             m.performance_exceeds_needs_analysis AS performance_exceeds_needs_analysis,
             m.performance_exceeds_needs_sources AS performance_exceeds_needs_sources,
             m.willingness_to_pay_declining_rating AS willingness_to_pay_declining_rating,
             m.willingness_to_pay_declining_analysis AS willingness_to_pay_declining_analysis,
             m.willingness_to_pay_declining_sources AS willingness_to_pay_declining_sources,
             m.shifting_purchase_criteria_rating AS shifting_purchase_criteria_rating,
             m.shifting_purchase_criteria_analysis AS shifting_purchase_criteria_analysis,
             m.shifting_purchase_criteria_sources AS shifting_purchase_criteria_sources,
             m.incumbents_overserving_rating AS incumbents_overserving_rating,
             m.incumbents_overserving_analysis AS incumbents_overserving_analysis,
             m.incumbents_overserving_sources AS incumbents_overserving_sources,
             m.new_segments_emerging_rating AS new_segments_emerging_rating,
             m.new_segments_emerging_analysis AS new_segments_emerging_analysis,
             m.new_segments_emerging_sources AS new_segments_emerging_sources,
             m.decreasing_differentiation_rating AS decreasing_differentiation_rating,
             m.decreasing_differentiation_analysis AS decreasing_differentiation_analysis,
             m.decreasing_differentiation_sources AS decreasing_differentiation_sources
      LIMIT 1
    `;

    const results = await executeReadQuery<Neo4jMarketData>(query, { 
      searchPattern, 
      id 
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }

    const market = convertNeo4jMarketToMarket(results[0]);

    return NextResponse.json({ market });
  } catch (error) {
    console.error("Error fetching market:", error);
    return NextResponse.json(
      { error: "Failed to fetch market" },
      { status: 500 }
    );
  }
}

