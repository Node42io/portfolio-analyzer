import { Market } from "@/types/market";

// Sample market data - this will be replaced with Neo4j data
export const sampleMarket: Market = {
  id: "maxillofacial-imaging",
  name: "Maxillofacial Imaging",
  type: "PARTIALLY_OVERSERVED",
  coreJobToBeDone: "Visualize and quantify maxillofacial bone, dental, and soft-tissue structures to inform restorative and surgical treatment planning.",
  metrics: {
    tam: "~US$3.1 B",
    cagr: "9.5%",
  },
  criteria: [
    {
      id: 1,
      title: "Core Functional Job Performance",
      severity: "HIGH",
      description: "CT and CBCT reliably handle bone and sinus imaging, TMJ MRI with AI accurately assesses discs, and CBCT panoramics match conventional x-rays for anatomic landmarks.",
    },
    {
      id: 2,
      title: "Performance Exceeds Customer Needs",
      severity: "MEDIUM",
      description: "Evidence shows 0.3–0.4 mm low-dose CBCT suffices for typical cases, and MRI meets soft tissue needs with AI and calibration improvements rather than higher hardware specs.",
    },
    {
      id: 3,
      title: "Customers Less Willing to pay for Performance Improvements",
      severity: "HIGH",
      description: "Dental imaging demand is shifting toward cost-conscious, efficiency-focused solutions—refurbished and mobile CBCT—while TMJ MRI remains steady, but no higher-cost upgrades.",
    },
    {
      id: 4,
      title: "Shifting Customer Purchasing Criteria",
      severity: "HIGH",
      description: "CT and x-ray purchasing is shifting from peak specs to low-dose, cost-efficient, and integrated workflows, with TMJ MRI advances emphasizing AI-assisted interpretation and consistency over hardware performance.",
    },
    {
      id: 5,
      title: "Incumbents Overserving the Market",
      severity: "HIGH",
      description: "Imaging advances outpace clinical needs, with low-dose CBCT sufficient, TMJ MRI gains driven by AI software, and CBCT panoramics reducing demand for new 2D systems.",
    },
    {
      id: 6,
      title: "New Market Segments Emerging",
      severity: "MEDIUM",
      description: "Emerging dental imaging trends focus on accessibility and workflow—through mobile CBCT, low-field MRI, AI-assisted TMJ analysis, and ultrasound—while high-end technologies like photon-counting CT target niche hospital markets.",
    },
    {
      id: 7,
      title: "Decreasing Differentiation",
      severity: "MEDIUM",
      description: "Hardware differentiation in dental imaging is declining as CT and CBCT systems show comparable image and workflow performance, shifting competition toward software, AI features, and integration.",
    },
  ],
};

