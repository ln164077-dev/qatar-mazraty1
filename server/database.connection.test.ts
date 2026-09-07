import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: true },
});

describe("database connection", () => {
  it("connects to the configured PostgreSQL database", async () => {
    expect(databaseUrl).toBeTruthy();
    const result = await pool.query<{ ok: number }>("SELECT 1 AS ok");
    expect(result.rows[0]?.ok).toBe(1);
  }, 15_000);
});

afterAll(async () => {
  await pool.end();
});
