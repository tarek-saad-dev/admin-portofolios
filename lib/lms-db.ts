import { Pool } from "pg";

declare global {
  var lmsDbPool: Pool | undefined;
}

export function getPool(): Pool {
  if (process.env.NODE_ENV === "development") {
    if (!global.lmsDbPool) {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) {
        console.error(
          "[LMS DB] DATABASE_URL is not set in environment variables",
        );
        throw new Error("DATABASE_URL environment variable is not set");
      }

      console.log(
        "[LMS DB] Creating new connection pool (dev mode - singleton)",
      );

      global.lmsDbPool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });

      global.lmsDbPool.on("error", (err) => {
        console.error("[LMS DB] Unexpected error on idle client", err);
      });

      global.lmsDbPool.on("connect", () => {
        console.log("[LMS DB] New client connected to pool");
      });
    }

    return global.lmsDbPool;
  }

  let pool: Pool | null = null;

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error(
        "[LMS DB] DATABASE_URL is not set in environment variables",
      );
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("[LMS DB] Creating new connection pool (production mode)");

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    pool.on("error", (err) => {
      console.error("[LMS DB] Unexpected error on idle client", err);
    });
  }

  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("[LMS DB Query]", {
      text: text.substring(0, 100),
      duration,
      rows: result.rowCount,
    });
    return result.rows as T[];
  } catch (error: any) {
    console.error("[LMS DB Error]", {
      text: text.substring(0, 100),
      error: error.message,
      code: error.code,
    });

    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      console.log("[LMS DB] Retrying query after connection error...");
      try {
        const result = await pool.query(text, params);
        console.log("[LMS DB] Retry successful");
        return result.rows as T[];
      } catch (retryError) {
        console.error("[LMS DB] Retry failed:", retryError);
        throw retryError;
      }
    }

    throw error;
  }
}

export async function transaction<T>(
  callback: (client: any) => Promise<T>,
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    console.log("[LMS DB Transaction] Committed successfully");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[LMS DB Transaction] Rolled back due to error:", error);
    throw error;
  } finally {
    client.release();
  }
}
