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
