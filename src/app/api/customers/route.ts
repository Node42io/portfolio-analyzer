import { NextResponse } from "next/server";
import { Customer } from "@/types/customer";

// API route to return customers - Bechtel (dairy) and Welfen Gymnasium (education)
export async function GET() {
  try {
    const customers: Customer[] = [
      {
        id: "bechtel",
        name: "Privatmolkerei Bechtel",
        insightLevel: "MEDIUM",
        insightCount: 38,
        lastUpdate: new Date().toLocaleDateString("de-DE"),
        totalUpdates: 124,
        newLearnings: 38,
        confirmedAssumptions: "72/52",
        latestInsight: "Privatmolkerei Bechtel is a German private dairy specializing in high-quality milk and dairy products.",
      },
      {
        id: "welfen-gymnasium",
        name: "Welfen Gymnasium",
        insightLevel: "HIGH",
        insightCount: 24,
        lastUpdate: new Date().toLocaleDateString("de-DE"),
        totalUpdates: 86,
        newLearnings: 24,
        confirmedAssumptions: "48/38",
        latestInsight: "Welfen Gymnasium is a German secondary school with modern laboratory facilities for science education.",
      },
    ];

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers", customers: [] },
      { status: 500 }
    );
  }
}

