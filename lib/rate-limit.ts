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

// Returns true only on the FIRST call within windowMs for this key.
// On subsequent calls within the same window, returns false.
// Resets automatically when the window expires.
export async function isNewSession(key: string, windowMs = 10 * 60_000): Promise<boolean> {
  try {
    const sql = getDb();
    await ensureTable(sql);
    const windowStart = new Date(Date.now() - windowMs);

    const [row] = await sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, NOW())
      ON CONFLICT (key) DO UPDATE SET
        count        = CASE WHEN rate_limits.window_start < ${windowStart} THEN 1 ELSE rate_limits.count END,
        window_start = CASE WHEN rate_limits.window_start < ${windowStart} THEN NOW() ELSE rate_limits.window_start END
      RETURNING count
    `;
    // count = 1 means either fresh insert or window just reset → new session
    return row?.count === 1;
  } catch {
    return true;
  }
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
