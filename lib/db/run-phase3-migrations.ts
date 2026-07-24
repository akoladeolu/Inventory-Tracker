import postgres from "postgres";
import fs from "fs";
import path from "path";

const directUrl = "postgresql://postgres.lezxzbqykcwbakahgemx:WYWS%2B2_hGRL%21zSd@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const sql = postgres(directUrl, { max: 1, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    console.log("Reading Phase 3 migration file...");
    const migration = fs.readFileSync(path.join(__dirname, "migrations", "0005_product_variants.sql"), "utf-8");

    console.log("Executing 0005_product_variants.sql...");
    await sql.unsafe(migration);
    console.log("0005_product_variants.sql executed successfully! 🎉");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
