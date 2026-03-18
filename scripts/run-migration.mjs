import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Read .env.local — handle multi-line and quoted values
const envContent = readFileSync(resolve(rootDir, ".env.local"), "utf-8");
let dbUrl = null;
for (const line of envContent.split("\n")) {
  if (line.startsWith("DATABASE_URL=")) {
    dbUrl = line.substring("DATABASE_URL=".length).trim();
    break;
  }
}

if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const { Pool } = pg;

async function main() {
  console.log("Connecting to Supabase PostgreSQL...");
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log("Connected!");

  const sqlPath = resolve(rootDir, "supabase_migration.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  try {
    console.log("Running migration (33 tables + bcSyncState + indexes)...\n");
    await client.query(sql);
    console.log("Migration completed successfully!\n");

    // Verify
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename LIKE 'bc%'
      ORDER BY tablename
    `);
    console.log(`Tables created: ${rows.length}`);
    for (const row of rows) {
      console.log(`  ✅ ${row.tablename}`);
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    if (err.position) {
      const lines = sql.substring(0, parseInt(err.position)).split("\n");
      console.error(`  at line ${lines.length}: ${lines[lines.length - 1]}`);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
