import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Interface for Kano Range data
interface KanoRangeData {
  factName: string;
  unitOfMeasure: string | null;
  reverseRange: string | null;
  mustBeRange: string | null;
  oneDimensionalRange: string | null;
  attractiveRange: string | null;
  classifiedAt: string | null;
}

// API route to fetch market-specific Kano ranges from Neo4j
// Returns BasicFacts with their Kano classification ranges for a specific market
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketName = searchParams.get("marketName");

    if (!marketName) {
      return NextResponse.json(
        { error: "marketName parameter is required", features: [] },
        { status: 400 }
      );
    }

    // Query to get Kano ranges for a specific market
    const query = `
      MATCH (bf:BasicFact)-[r:MARKET_KANO_CLASSIFIED_FOR]->(m:Market)
      WHERE m.name = $marketName
      RETURN 
        bf.name as factName,
        bf.unit_of_measure as unitOfMeasure,
        r.reverse_range as reverseRange,
        r.must_be_range as mustBeRange,
        r.one_dimensional_range as oneDimensionalRange,
        r.attractive_range as attractiveRange,
        r.classified_at as classifiedAt
      ORDER BY bf.name
    `;

    const results = await executeReadQuery<KanoRangeData>(query, { marketName: decodeURIComponent(marketName) });

    // Transform results to features array
    const features = results.map((record, index) => ({
      id: `feature-${index}`,
      name: record.factName,
      unitOfMeasure: record.unitOfMeasure || "",
      reverseRange: record.reverseRange || "—",
      mustBeRange: record.mustBeRange || "—",
      oneDimensionalRange: record.oneDimensionalRange || "—",
      attractiveRange: record.attractiveRange || "—",
      classifiedAt: record.classifiedAt || null,
    }));

    return NextResponse.json({ features, count: features.length });
  } catch (error) {
    console.error("Error fetching Kano ranges:", error);
    return NextResponse.json(
      { error: "Failed to fetch Kano ranges", features: [] },
      { status: 500 }
    );
  }
}



