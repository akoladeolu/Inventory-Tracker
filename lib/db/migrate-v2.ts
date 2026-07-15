import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

async function run() {
  console.log("Connecting to database...");
  const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

  try {
    console.log("Running DDL migration...");

    // 1. Create the discount_type enum if it doesn't exist
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
              CREATE TYPE "discount_type" AS ENUM('percentage', 'fixed');
          END IF;
      END$$;
    `;
    console.log("✓ Checked/created discount_type enum");

    // 2. Create the brands table
    await sql`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text DEFAULT '',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "brands_name_unique" UNIQUE("name")
      );
    `;
    console.log("✓ Checked/created brands table");

    // 3. Create the coupons table
    await sql`
      CREATE TABLE IF NOT EXISTS "coupons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "code" varchar(50) NOT NULL,
        "discount_type" "discount_type" DEFAULT 'percentage' NOT NULL,
        "discount_value" numeric(10, 2) NOT NULL,
        "min_purchase_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
        "max_discount_amount" numeric(10, 2),
        "active" boolean DEFAULT true NOT NULL,
        "start_date" timestamp DEFAULT now() NOT NULL,
        "end_date" timestamp,
        "usage_limit" integer,
        "usage_count" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "coupons_code_unique" UNIQUE("code")
      );
    `;
    console.log("✓ Checked/created coupons table");

    // 4. Create the notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "type" varchar(50) DEFAULT 'system' NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Checked/created notifications table");

    // 5. Create the activity_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS "activity_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" varchar(100),
        "details" text DEFAULT '',
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✓ Checked/created activity_logs table");

    // 6. Add new columns to products
    await sql`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_id" uuid REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    await sql`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" varchar(100);
    `;
    console.log("✓ Checked/added brand_id and barcode to products table");

    // 7. Add coupon_id column to sales
    await sql`
      ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "coupon_id" uuid REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    console.log("✓ Checked/added coupon_id to sales table");

    // 8. Create constraints and indexes
    await sql`
      ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_barcode_unique";
    `;
    await sql`
      ALTER TABLE "products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products" ("brand_id");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "products" ("barcode");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS "sales_coupon_idx" ON "sales" ("coupon_id");
    `;
    console.log("✓ Checked/created constraints and indexes");

    // Data Migration: Transfer raw string brand values into normalized brands table
    console.log("Starting brand data migration...");
    
    // Check if the old brand column exists
    const oldBrandColumnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' and column_name='brand';
    `;

    if (oldBrandColumnCheck.length > 0) {
      console.log("Old 'brand' column exists. Migrating data...");
      
      // Get all products with a brand value
      const productsWithBrands = await sql`
        SELECT id, brand FROM "products" WHERE brand IS NOT NULL AND brand != '';
      `;

      if (productsWithBrands.length > 0) {
        console.log(`Found ${productsWithBrands.length} products with old brand names.`);
        
        // Extract unique brand names
        const uniqueBrandNames = Array.from(new Set(productsWithBrands.map(p => p.brand.trim())));
        
        console.log(`Unique brands to create: ${uniqueBrandNames.join(", ")}`);

        // Insert brands and build a name -> id mapping
        const brandNameToId: Record<string, string> = {};
        for (const brandName of uniqueBrandNames) {
          // Insert or get existing brand
          const [brand] = await sql`
            INSERT INTO "brands" (name) 
            VALUES (${brandName})
            ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
            RETURNING id;
          `;
          brandNameToId[brandName] = brand.id;
        }

        // Update products with brand_id
        console.log("Updating products with brand_id foreign keys...");
        for (const p of productsWithBrands) {
          const brandId = brandNameToId[p.brand.trim()];
          if (brandId) {
            await sql`
              UPDATE "products" 
              SET brand_id = ${brandId} 
              WHERE id = ${p.id};
            `;
          }
        }
        console.log("✓ Brand data migration complete.");
      } else {
        console.log("No brand data found to migrate.");
      }

      // Drop the old brand column from products to complete normalization
      console.log("Dropping old 'brand' column...");
      await sql`
        ALTER TABLE "products" DROP COLUMN IF EXISTS "brand";
      `;
      console.log("✓ Dropped old 'brand' column.");
    } else {
      console.log("Old 'brand' column does not exist. Skipping data migration.");
    }

    console.log("V2 database migrations successfully completed! 🎉");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
