import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { db } from "./index";
import { categories } from "./schema";
import { DEFAULT_CATEGORIES } from "@/constants";

async function seed() {
  console.log("Seeding default categories...");

  for (const name of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values({ name })
      .onConflictDoNothing({ target: categories.name });
  }

  console.log("Default categories seeded successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
