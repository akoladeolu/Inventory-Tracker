import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brands, products } from "@/lib/db/schema";
import type { BrandInput } from "@/lib/validations";

export async function getBrands() {
  return db.select().from(brands).orderBy(brands.name);
}

export async function createBrand(input: BrandInput) {
  const [brand] = await db.insert(brands).values(input).returning();
  return brand;
}

export async function updateBrand(id: string, input: BrandInput) {
  const [brand] = await db
    .update(brands)
    .set({ ...input, updated_at: new Date() })
    .where(eq(brands.id, id))
    .returning();

  if (!brand) {
    throw new Error("Brand not found");
  }

  return brand;
}

export async function deleteBrand(id: string) {
  // Check if brand is referenced by products
  const productCount = await db
    .select()
    .from(products)
    .where(eq(products.brand_id, id))
    .limit(1);

  if (productCount.length > 0) {
    throw new Error("Cannot delete brand that is linked to products");
  }

  await db.delete(brands).where(eq(brands.id, id));
}
