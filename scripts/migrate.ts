/**
 * Inicializa / actualiza el schema completo de la DB.
 * Ejecutar una sola vez después de cada deploy que modifique el schema:
 *
 *   DATABASE_URL=... npm run migrate
 */
import postgres from 'postgres';
import { ensureFullSchema } from '../lib/db-migrate';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL env var is required');

  const sql = postgres(url, { ssl: 'require' });

  console.log('Running migrations...');
  await ensureFullSchema(sql);
  console.log('Done.');

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
