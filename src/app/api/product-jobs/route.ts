import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Interface for Product Job data from Neo4j
interface ProductJobData {
  name: string;
  category: string;
  statement: string | null;
  description: string | null;
}

// Job category definitions with descriptions
const CATEGORY_INFO: Record<string, { bullets: string[] }> = {
  "Acquisition": {
    bullets: [
      "How customers find, evaluate, and obtain the product",
      "Research options, compare alternatives, evaluate fit",
      "Make purchase decision, complete transaction",
      "Receive, verify, register, activate"
    ]
  },
  "Preparation": {
    bullets: [
      "How customers ready the product for use",
      "Unbox, assemble, install, configure",
      "Connect, calibrate, personalize",
      "Learn to use, train others"
    ]
  },
  "Usage": {
    bullets: [
      "How customers employ the product for its core function",
      "Operate, execute core functions",
      "Monitor, adjust during use",
      "Apply across different contexts"
    ]
  },
  "Maintenance": {
    bullets: [
      "How customers keep the product working",
      "Clean, service, inspect",
      "Update, upgrade, repair",
      "Store, protect, optimize"
    ]
  },
  "Disposal": {
    bullets: [
      "How customers end the product lifecycle",
      "Decommission, backup data, transfer ownership",
      "Recycle, donate, return",
      "Document, archive, replace"
    ]
  }
};

// API route to fetch product jobs from Neo4j
// Returns jobs for a specific UNSPSC commodity (e.g., Filling machinery)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId") || "23181501"; // Default to Filling machinery
    const category = searchParams.get("category");

    let query = "";
    const params: Record<string, string> = { commodityId };

    if (category) {
      // Get jobs for a specific category
      query = `
        MATCH (j:JTBDProductJob)
        WHERE j.commodity_id = $commodityId AND j.category = $category
        RETURN j.name as name, j.category as category, j.statement as statement, j.description as description
        ORDER BY j.name
      `;
      params.category = category;
    } else {
      // Get all jobs grouped by category
      query = `
        MATCH (j:JTBDProductJob)
        WHERE j.commodity_id = $commodityId
        RETURN j.name as name, j.category as category, j.statement as statement, j.description as description
        ORDER BY j.category, j.name
      `;
    }

    const results = await executeReadQuery<ProductJobData>(query, params);

    // Group jobs by category and add category info
    const jobsByCategory: Record<string, { 
      name: string; 
      bullets: string[];
      jobs: Array<{ name: string; statement: string; description: string }>;
      count: number;
    }> = {};

    // Initialize categories with info
    for (const [categoryName, info] of Object.entries(CATEGORY_INFO)) {
      jobsByCategory[categoryName] = {
        name: categoryName,
        bullets: info.bullets,
        jobs: [],
        count: 0
      };
    }

    // Populate with actual jobs
    for (const job of results) {
      const cat = job.category;
      if (jobsByCategory[cat]) {
        jobsByCategory[cat].jobs.push({
          name: job.name,
          statement: job.statement || "",
          description: job.description || ""
        });
        jobsByCategory[cat].count++;
      }
    }

    // Convert to array and return
    const categories = Object.values(jobsByCategory);

    return NextResponse.json({ 
      categories,
      totalJobs: results.length 
    });
  } catch (error) {
    console.error("Error fetching product jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch product jobs", categories: [] },
      { status: 500 }
    );
  }
}



