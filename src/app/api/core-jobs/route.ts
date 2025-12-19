import { NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Interface for Error Statement data from Neo4j
interface ErrorStatementData {
  statement: string;
  category: string | null;
  impact: string | null;
  kpi_name: string | null;
  kpi_unit: string | null;
  related_job_map_steps: string[] | null;
  related_core_jobs: string[] | null;
}

// Interface for Core Job data
interface CoreJobData {
  name: string;
  statement: string | null;
  category: string | null;
  description: string | null;
}

// Interface for Job Map Step data
interface JobMapStepData {
  name: string;
  description: string | null;
  step_number: number | null;
}

// API route to fetch Core Jobs, Job Map Steps, and Error Statements for a market
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketName = searchParams.get("marketName");

    let errorStatements: ErrorStatementData[] = [];
    let coreJobs: CoreJobData[] = [];
    let jobMapSteps: JobMapStepData[] = [];
    let coreFunctionalJob = "";

    // Decode the market name (it may come URL-encoded)
    const decodedMarketName = marketName ? decodeURIComponent(marketName) : "";
    console.log("Fetching data for market:", decodedMarketName);

    // Fetch Error Statements for this market
    try {
      const errorQuery = `
        MATCH (m:Market {name: $marketName})-[:HAS_ERROR_STATEMENT]->(es:JTBDErrorStatement)
        RETURN es.statement as statement, es.category as category, es.impact as impact,
               es.kpi_name as kpi_name, es.kpi_unit as kpi_unit,
               es.related_job_map_steps as related_job_map_steps,
               es.related_core_jobs as related_core_jobs
        ORDER BY es.category
      `;
      errorStatements = await executeReadQuery<ErrorStatementData>(errorQuery, { marketName: decodedMarketName });
      console.log(`Found ${errorStatements.length} error statements`);
    } catch (err) {
      console.error("Error fetching error statements:", err);
    }

    // Fetch Core Jobs for this market
    try {
      const coreJobQuery = `
        MATCH (m:Market {name: $marketName})-[:HAS_CORE_JOB]->(cj:JTBDCoreJob)
        RETURN cj.name as name, cj.statement as statement, 
               cj.category as category, cj.description as description
        ORDER BY cj.category, cj.name
      `;
      coreJobs = await executeReadQuery<CoreJobData>(coreJobQuery, { marketName: decodedMarketName });
      console.log(`Found ${coreJobs.length} core jobs`);
    } catch (err) {
      console.error("Error fetching core jobs:", err);
    }

    // Fetch Job Map Steps for this market
    try {
      const stepsQuery = `
        MATCH (m:Market {name: $marketName})-[:HAS_JOB_MAP_STEP]->(s:JTBDJobMapStep)
        RETURN s.name as name, s.description as description, s.step_number as step_number
        ORDER BY s.step_number
      `;
      jobMapSteps = await executeReadQuery<JobMapStepData>(stepsQuery, { marketName: decodedMarketName });
      console.log(`Found ${jobMapSteps.length} job map steps`);
    } catch (err) {
      console.error("Error fetching job map steps:", err);
    }

    // Fetch Core Functional Job from market properties
    try {
      const cfjQuery = `
        MATCH (m:Market {name: $marketName})
        RETURN m.core_functional_job as cfj, m.jtbd_cfj as jtbd_cfj
      `;
      const cfjResult = await executeReadQuery<{ cfj: string | null; jtbd_cfj: string | null }>(cfjQuery, { marketName: decodedMarketName });
      if (cfjResult.length > 0) {
        coreFunctionalJob = cfjResult[0].jtbd_cfj || cfjResult[0].cfj || "";
      }
    } catch (err) {
      console.error("Error fetching CFJ:", err);
    }

    // Build steps structure - group error statements by their related job map steps
    // Get unique step names from the database or use defaults
    const uniqueStepNames = [...new Set(jobMapSteps.map(s => s.name))];
    
    // Use actual steps from database if available, otherwise use generic steps
    // Force convert any BigInt to number to avoid sort() issues
    const toNumber = (val: unknown): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'bigint') return Number(val);
      if (typeof val === 'number') return val;
      return Number(val) || 0;
    };

    // Sort job map steps by step_number first, then assign sequential order (1-N)
    const sortedJobMapSteps = [...jobMapSteps].sort((a, b) => 
      toNumber(a.step_number) - toNumber(b.step_number)
    );

    const stepsToUse: Array<{ order: number; name: string; description: string; dbStepNumber: number }> = sortedJobMapSteps.length > 0 
      ? sortedJobMapSteps.map((step, index) => ({
          order: index + 1,  // Assign unique sequential order 1-N
          name: step.name,
          description: step.description || "",
          dbStepNumber: toNumber(step.step_number)
        }))
      : [
          { order: 1, name: "Define", description: "Clarify requirements and parameters", dbStepNumber: 1 },
          { order: 2, name: "Locate", description: "Find and identify needed resources", dbStepNumber: 2 },
          { order: 3, name: "Prepare", description: "Ready materials and environment", dbStepNumber: 3 },
          { order: 4, name: "Confirm", description: "Verify conditions are correct", dbStepNumber: 4 },
          { order: 5, name: "Execute", description: "Perform the core activity", dbStepNumber: 5 },
          { order: 6, name: "Monitor", description: "Track progress and status", dbStepNumber: 6 },
          { order: 7, name: "Modify", description: "Adjust based on feedback", dbStepNumber: 7 },
          { order: 8, name: "Conclude", description: "Complete and finalize", dbStepNumber: 8 },
        ];

    // Steps are already sorted and unique by construction
    const sortedSteps = stepsToUse;

    // Map error statements to steps
    const steps = sortedSteps.map((step) => {
      // Find error statements related to this step
      const stepErrors = errorStatements.filter((es) => {
        const relatedSteps = es.related_job_map_steps;
        if (Array.isArray(relatedSteps)) {
          return relatedSteps.some(s => {
            const stepNameLower = step.name.toLowerCase();
            const relatedStepLower = s.toLowerCase();
            // Match if step name is contained in the related step or vice versa
            return relatedStepLower.includes(stepNameLower) || 
                   stepNameLower.includes(relatedStepLower) ||
                   // Also match partial words
                   relatedStepLower.split(/\s+/).some(word => stepNameLower.includes(word)) ||
                   stepNameLower.split(/\s+/).some(word => relatedStepLower.includes(word));
          });
        }
        return false;
      });

      return {
        order: step.order,
        name: step.name,
        description: step.description || "",
        errorStatements: stepErrors.map((es) => ({
          statement: es.statement,
          category: es.category || "General",
          impact: es.impact || "",
          kpiName: es.kpi_name || "",
          kpiUnit: es.kpi_unit || "",
          relatedCoreJobs: es.related_core_jobs || [],
        })),
        needsCount: stepErrors.length,
      };
    });

    // Group core jobs by category and include related error statements
    const coreJobsByCategory: Record<string, Array<{ 
      name: string; 
      statement: string; 
      description: string;
      errorStatements: Array<{
        statement: string;
        category: string;
        kpiName: string;
        kpiUnit: string;
      }>;
    }>> = {};
    
    for (const job of coreJobs) {
      const category = job.category || "General";
      if (!coreJobsByCategory[category]) {
        coreJobsByCategory[category] = [];
      }
      
      // Find error statements where this core job is in related_core_jobs
      const relatedErrors = errorStatements.filter((es) => {
        const relatedCoreJobs = es.related_core_jobs;
        if (Array.isArray(relatedCoreJobs)) {
          return relatedCoreJobs.some(relatedJob => 
            relatedJob.toLowerCase() === job.name.toLowerCase() ||
            relatedJob.toLowerCase().includes(job.name.toLowerCase()) ||
            job.name.toLowerCase().includes(relatedJob.toLowerCase())
          );
        }
        return false;
      });
      
      coreJobsByCategory[category].push({
        name: job.name,
        statement: job.statement || "",
        description: job.description || "",
        errorStatements: relatedErrors.map((es) => ({
          statement: es.statement,
          category: es.category || "General",
          kpiName: es.kpi_name || "",
          kpiUnit: es.kpi_unit || "",
        })),
      });
    }

    // Default CFJ if none found
    if (!coreFunctionalJob) {
      coreFunctionalJob = "Enable accurate and efficient filling operations with minimal product waste and maximum uptime";
    }

    return NextResponse.json({
      steps,
      coreJobs: coreJobsByCategory,
      coreFunctionalJob,
      totalCoreJobs: coreJobs.length,
      totalErrorStatements: errorStatements.length,
      totalJobMapSteps: jobMapSteps.length,
    });
  } catch (error) {
    console.error("Error fetching core jobs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch core jobs", 
        steps: [],
        coreJobs: {},
        coreFunctionalJob: "Enable accurate and efficient filling operations with minimal product waste and maximum uptime",
        totalCoreJobs: 0,
        totalErrorStatements: 0,
        totalJobMapSteps: 0,
      },
      { status: 500 }
    );
  }
}
