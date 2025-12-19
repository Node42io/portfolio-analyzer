import { NextResponse } from "next/server";
import { Customer } from "@/types/customer";

// API route to return sample customers (Danone and Rügenwalder)
// These represent end customers who use filling machinery products
export async function GET() {
  try {
    // Sample customers - food companies that use filling machinery
    const customers: Customer[] = [
      {
        id: "danone",
        name: "Danone",
        insightLevel: "HIGH",
        insightCount: 69,
        lastUpdate: new Date().toLocaleDateString("de-DE"),
        totalUpdates: 287,
        newLearnings: 69,
        confirmedAssumptions: "236/51",
        latestInsight: "Danone is a leading global food company focused on dairy products, plant-based alternatives, and specialized nutrition.",
      },
      {
        id: "rugenwalder",
        name: "Rügenwalder Mühle",
        insightLevel: "MEDIUM",
        insightCount: 45,
        lastUpdate: new Date().toLocaleDateString("de-DE"),
        totalUpdates: 156,
        newLearnings: 45,
        confirmedAssumptions: "89/67",
        latestInsight: "Rügenwalder Mühle is a German food producer known for sausage products and vegetarian alternatives.",
      },
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

