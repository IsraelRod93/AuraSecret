import postgres from 'postgres';

let _sql: ReturnType<typeof postgres>;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not configured');
    _sql = postgres(url, { ssl: 'require' });
  }
  return _sql;
}

export async function ensureUserSchema(sql: ReturnType<typeof postgres>) {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT`;
  } catch (error) {
    if (error instanceof Error && /relation \"users\" does not exist/.test(error.message)) {
      throw new Error('La tabla users no existe en la base de datos');
    }
    throw error;
  }
}
