import { getDb } from './lib/db';
async function main() {
  const sql = getDb();
  try {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companions'`;
    console.log(cols);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
main();
