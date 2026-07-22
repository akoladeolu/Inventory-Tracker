import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return await db.select().from(categories).orderBy(categories.name);
}

export async function createCategory(name: string) {
  const [data] = await db
    .insert(categories)
    .values({ name })
    .returning();

  revalidatePath("/categories");
  return data;
}

export async function updateCategory(id: string, name: string) {
  const [data] = await db
    .update(categories)
    .set({ name, updated_at: new Date() })
    .where(eq(categories.id, id))
    .returning();

  revalidatePath("/categories");
  return data;
}

export async function deleteCategory(id: string) {
  // Check if category has products
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.category_id, id));

  if (count > 0) {
    throw new Error("Cannot delete category with products");
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/categories");
}

