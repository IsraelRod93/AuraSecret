import { getDb } from '@/lib/db';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

let tableReady = false;

async function ensureTable(sql: ReturnType<typeof getDb>) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {});
  tableReady = true;
}

export async function checkRateLimit(key: string, maxPerWindow = MAX_PER_WINDOW): Promise<boolean> {
  try {
    const sql = getDb();
    await ensureTable(sql);
    const windowStart = new Date(Date.now() - WINDOW_MS);
    const now = new Date();

    const [result] = await sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, ${now})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < ${windowStart} THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < ${windowStart} THEN ${now}
          ELSE rate_limits.window_start
        END
      RETURNING count
    `;

    return result.count <= maxPerWindow;
  } catch {
    return true;
  }
}
