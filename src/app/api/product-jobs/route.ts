import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Helper to convert Neo4j integers to regular values
const toValue = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  // Neo4j integers come as {low, high} objects
  if (typeof val === 'object' && val !== null && 'low' in val) {
    return String((val as { low: number; high: number }).low);
  }
  if (typeof val === 'bigint') return String(val);
  return String(val);
};

// Interface for Product Job data from Neo4j
interface ProductJobData {
  name: string;
  statement: string | null;
  description: string | null;
  category: string | null;
  level: unknown;
  use_context: string | null;
  user_group: string | null;
  frequency: string | null;
}

// Product Job categories (the 5 classifications)
const PRODUCT_JOB_CATEGORIES = [
  "Acquisition",
  "Preparation", 
  "Usage",
  "Maintenance",
  "Disposal"
];

// API route to fetch Product Jobs for a commodity grouped by category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId");

    if (!commodityId) {
      return NextResponse.json(
        { error: "commodityId is required" },
        { status: 400 }
      );
    }

    console.log("Fetching product jobs for commodity:", commodityId);

    let productJobs: ProductJobData[] = [];

    // Fetch Product Jobs for this commodity
    try {
      const jobsQuery = `
        MATCH (c:UNSPSCCommodity {commodity_id: $commodityId})-[:HAS_PRODUCT_JOB]->(pj:JTBDProductJob)
        RETURN pj.name as name, pj.statement as statement, pj.description as description,
               pj.category as category, pj.level as level, pj.use_context as use_context,
               pj.user_group as user_group, pj.frequency as frequency
        ORDER BY pj.category, pj.name
      `;
      productJobs = await executeReadQuery<ProductJobData>(jobsQuery, { commodityId });
      console.log(`Found ${productJobs.length} product jobs`);
    } catch (err) {
      console.error("Error fetching product jobs:", err);
    }

    // Group jobs by category
    const jobsByCategory: Record<string, Array<{
      name: string;
      statement: string;
      description: string;
      level: string;
      useContext: string;
      userGroup: string;
      frequency: string;
    }>> = {};

    // Initialize all categories
    for (const cat of PRODUCT_JOB_CATEGORIES) {
      jobsByCategory[cat] = [];
    }

    // Group the jobs
    for (const job of productJobs) {
      const category = job.category || "Usage";
      if (!jobsByCategory[category]) {
        jobsByCategory[category] = [];
      }
      jobsByCategory[category].push({
        name: job.name,
        statement: job.statement || "",
        description: job.description || "",
        level: toValue(job.level),
        useContext: job.use_context || "",
        userGroup: job.user_group || "",
        frequency: job.frequency || "",
      });
    }

    // Count jobs per category
    const categoryCounts: Record<string, number> = {};
    for (const cat of PRODUCT_JOB_CATEGORIES) {
      categoryCounts[cat] = jobsByCategory[cat]?.length || 0;
    }

    return NextResponse.json({
      jobsByCategory,
      categoryCounts,
      totalJobs: productJobs.length,
      categories: PRODUCT_JOB_CATEGORIES,
    });
  } catch (error) {
    console.error("Error fetching product jobs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch product jobs",
        jobsByCategory: {},
        categoryCounts: {},
        totalJobs: 0,
        categories: PRODUCT_JOB_CATEGORIES,
      },
      { status: 500 }
    );
  }
}
