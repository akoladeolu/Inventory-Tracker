import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import type { SupplierInput } from "@/lib/validations";

export async function getSuppliers() {
  return db.select().from(suppliers).orderBy(suppliers.name);
}

export async function createSupplier(input: SupplierInput) {
  const [supplier] = await db.insert(suppliers).values(input).returning();
  return supplier;
}

export async function updateSupplier(id: string, input: SupplierInput) {
  const [supplier] = await db
    .update(suppliers)
    .set({ ...input, updated_at: new Date() })
    .where(eq(suppliers.id, id))
    .returning();

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
}

export async function deleteSupplier(id: string) {
  await db.delete(suppliers).where(eq(suppliers.id, id));
}
