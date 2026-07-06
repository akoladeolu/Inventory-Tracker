import { db } from "@/lib/db";
import { products, stock_movements, inventory } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

type MovementType = "stock_in" | "stock_out" | "adjustment" | "return";

interface StockMovementInput {
  product_id: string;
  type: MovementType;
  quantity: number;
  user_id: string;
  notes?: string;
}

export async function recordStockMovement(input: StockMovementInput) {
  return await db.transaction(async (tx) => {
    let previousQuantity: number;
    let newQuantity: number;
    let updated: typeof products.$inferSelect | undefined;

    switch (input.type) {
      case "stock_in":
      case "return":
        [updated] = await tx
          .update(products)
          .set({
            quantity: sql`${products.quantity} + ${input.quantity}`,
            updated_at: new Date(),
          })
          .where(eq(products.id, input.product_id))
          .returning();

        if (!updated) {
          throw new Error("Product not found");
        }

        newQuantity = updated.quantity;
        previousQuantity = newQuantity - input.quantity;
        break;
      case "stock_out":
        [updated] = await tx
          .update(products)
          .set({
            quantity: sql`${products.quantity} - ${input.quantity}`,
            updated_at: new Date(),
          })
          .where(and(eq(products.id, input.product_id), gte(products.quantity, input.quantity)))
          .returning();

        if (!updated) {
          throw new Error("Insufficient stock or product not found");
        }

        newQuantity = updated.quantity;
        previousQuantity = newQuantity + input.quantity;
        break;
      case "adjustment":
        previousQuantity = await tx
          .select({ quantity: products.quantity })
          .from(products)
          .where(eq(products.id, input.product_id))
          .then((rows) => rows[0]?.quantity ?? 0);
        newQuantity = input.quantity;
        [updated] = await tx
          .update(products)
          .set({ quantity: newQuantity, updated_at: new Date() })
          .where(eq(products.id, input.product_id))
          .returning();

        if (!updated) {
          throw new Error("Product not found");
        }
        break;
      default:
        throw new Error("Invalid movement type");
    }

    await tx
      .insert(inventory)
      .values({ product_id: input.product_id, quantity: newQuantity })
      .onConflictDoUpdate({
        target: inventory.product_id,
        set: { quantity: newQuantity, updated_at: new Date() },
      });

    const [movement] = await tx
      .insert(stock_movements)
      .values({
        product_id: input.product_id,
        type: input.type,
        quantity: input.quantity,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        user_id: input.user_id,
        notes: input.notes || "",
      })
      .returning();

    return movement;
  });
}

export async function getStockMovements(params?: {
  product_id?: string;
  page?: number;
  per_page?: number;
}) {
  const page = params?.page || 1;
  const per_page = params?.per_page || 50;
  const from = (page - 1) * per_page;

  const where = params?.product_id ? eq(stock_movements.product_id, params.product_id) : undefined;

  const data = await db
    .select({
      id: stock_movements.id,
      type: stock_movements.type,
      quantity: stock_movements.quantity,
      previous_quantity: stock_movements.previous_quantity,
      new_quantity: stock_movements.new_quantity,
      notes: stock_movements.notes,
      created_at: stock_movements.created_at,
      product: {
        id: products.id,
        name: products.name,
        sku: products.sku,
      },
    })
    .from(stock_movements)
    .innerJoin(products, eq(stock_movements.product_id, products.id))
    .where(where)
    .orderBy(sql`${stock_movements.created_at} DESC`)
    .limit(per_page)
    .offset(from);

  return data;
}
