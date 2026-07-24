import postgres from "postgres";
import fs from "fs";
import path from "path";

const directUrl = "postgresql://postgres.lezxzbqykcwbakahgemx:WYWS%2B2_hGRL%21zSd@aws-1-us-east-2.pooler.supabase.com:5432/postgres";
const sql = postgres(directUrl, { max: 1, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    console.log("Reading Phase 1 migration files...");
    const migration1 = fs.readFileSync(path.join(__dirname, "migrations", "0003_phase1_features.sql"), "utf-8");
    const migration2 = fs.readFileSync(path.join(__dirname, "migrations", "0004_stock_audit_rpcs.sql"), "utf-8");

    console.log("Executing 0003_phase1_features.sql...");
    await sql.unsafe(migration1);
    console.log("0003_phase1_features.sql executed successfully!");

    console.log("Executing 0004_stock_audit_rpcs.sql...");
    await sql.unsafe(migration2);
    console.log("0004_stock_audit_rpcs.sql executed successfully!");

    console.log("All Phase 1 migrations completed successfully! 🎉");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
