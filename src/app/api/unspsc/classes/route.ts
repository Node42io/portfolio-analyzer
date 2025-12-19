import { NextRequest, NextResponse } from "next/server";
import { executeReadQuery } from "@/lib/neo4j";

// Interface for UNSPSC Class with hierarchy info
interface UnspscClassData {
  className: string;
  classId: string;
  familyName: string;
  familyId: string;
  segmentName: string;
  segmentId: string;
}

// GET /api/unspsc/classes - Fetch UNSPSC classes connected to a company's products with hierarchy
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyName = searchParams.get("companyName");

    if (!companyName) {
      return NextResponse.json({ classes: [], grouped: {} });
    }

    // Fetch UNSPSC classes with segment and family info using correct relationships
    // Path: Company -> HAS_PRODUCT -> Product -> HAS_UNSPSC_CLASSIFICATION -> UNSPSCCommodity
    //       <- HAS_COMMODITY <- UNSPSCClass <- HAS_CLASS <- UNSPSCFamily <- HAS_FAMILY <- UNSPSCSegment
    const query = `
      MATCH (c:Company)-[:HAS_PRODUCT]->(p:Product)-[:HAS_UNSPSC_CLASSIFICATION]->(com:UNSPSCCommodity)
      WHERE c.name = $companyName
      MATCH (cls:UNSPSCClass)-[:HAS_COMMODITY]->(com)
      MATCH (fam:UNSPSCFamily)-[:HAS_CLASS]->(cls)
      MATCH (seg:UNSPSCSegment)-[:HAS_FAMILY]->(fam)
      RETURN DISTINCT 
        cls.class_title AS className,
        cls.class_id AS classId,
        fam.family_title AS familyName,
        fam.family_id AS familyId,
        seg.segment_title AS segmentName,
        seg.segment_id AS segmentId
      ORDER BY seg.segment_id, fam.family_id, cls.class_id
    `;

    const results = await executeReadQuery<UnspscClassData>(query, { companyName });

    // Build flat list for dropdown
    const classes = results.map(r => ({
      value: r.className,
      label: r.className,
      classId: r.classId || "",
      familyName: r.familyName || "Unknown Family",
      familyId: r.familyId || "",
      segmentName: r.segmentName || "Unknown Segment",
      segmentId: r.segmentId || "",
    }));

    // Build grouped structure for display
    const grouped: Record<string, {
      segmentName: string;
      segmentId: string;
      families: Record<string, {
        familyName: string;
        familyId: string;
        classes: Array<{
          value: string;
          label: string;
          classId: string;
        }>;
      }>;
    }> = {};

    for (const cls of classes) {
      const segKey = cls.segmentId || cls.segmentName;
      const famKey = cls.familyId || cls.familyName;

      if (!grouped[segKey]) {
        grouped[segKey] = {
          segmentName: cls.segmentName,
          segmentId: cls.segmentId,
          families: {},
        };
      }

      if (!grouped[segKey].families[famKey]) {
        grouped[segKey].families[famKey] = {
          familyName: cls.familyName,
          familyId: cls.familyId,
          classes: [],
        };
      }

      grouped[segKey].families[famKey].classes.push({
        value: cls.value,
        label: cls.label,
        classId: cls.classId,
      });
    }

    return NextResponse.json({ classes, grouped });
  } catch (error) {
    console.error("Error fetching UNSPSC classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch UNSPSC classes" },
      { status: 500 }
    );
  }
}
