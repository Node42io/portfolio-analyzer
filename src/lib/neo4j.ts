import neo4j, { Driver } from "neo4j-driver";

// Neo4j connection singleton for the application
let driver: Driver | null = null;

// Initialize Neo4j driver with credentials from environment variables
export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      throw new Error("Missing Neo4j configuration. Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables.");
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

// Close the driver connection (for cleanup)
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Execute a read query and return the results
export async function executeReadQuery<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

