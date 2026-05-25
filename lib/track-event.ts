import { getDb } from '@/lib/db';

let tableReady = false;

async function ensureTable(sql: ReturnType<typeof getDb>) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS user_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_name TEXT NOT NULL,
      user_id UUID,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});
  await sql`
    CREATE INDEX IF NOT EXISTS user_events_name_created_idx ON user_events (event_name, created_at)
  `.catch(() => {});
  tableReady = true;
}

export async function trackEvent(
  eventName: string,
  userId?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    const sql = getDb();
    await ensureTable(sql);
    await sql`
      INSERT INTO user_events (event_name, user_id, metadata)
      VALUES (
        ${eventName},
        ${userId || null}::uuid,
        ${metadata ? JSON.stringify(metadata) : null}::jsonb
      )
    `;
  } catch {
    // Never throw from analytics
  }
}
