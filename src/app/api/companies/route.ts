import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// GET /api/companies - Fetch all companies from Neo4j
export async function GET() {
  try {
    const query = `
      MATCH (c:Company)
      WHERE c.name IS NOT NULL
      RETURN DISTINCT c.name AS name
      ORDER BY c.name ASC
    `;

    const results = await executeReadQuery<{ name: string }>(query);
    
    const companies = results.map(r => ({
      value: r.name,
      label: r.name,
    }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

