import pg from "pg";
const { Pool } = pg;
import { env } from "./constants.js";

const TideDB = new Pool({
  connectionString: env.DATABASE_URL,
});

export async function getSubgraphVersion(
  subgraphNumber: number,
  tableName: string
): Promise<number> {
  const query = `SELECT version
    FROM "${tableName}"
    WHERE number = ${subgraphNumber}`;

  const res = await TideDB.query(query);
  return res.rows[0].version;
}

export async function updateSubgraphVersion(
  subgraphNumber: number,
  versionNumber: number,
  tableName: string
): Promise<void> {
  const query = `UPDATE "${tableName}"
    SET "version" = ${versionNumber}
    WHERE "number" = ${subgraphNumber}`;

  try {
    await TideDB.query(query);
  } catch (e) {
    console.error(e);
  }
}
