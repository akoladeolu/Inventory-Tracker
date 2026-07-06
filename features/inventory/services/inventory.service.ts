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
    const previousQuantity = await tx
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, input.product_id))
      .then((rows) => rows[0]?.quantity ?? 0);

    let newQuantity: number;
    let guardCondition;

    switch (input.type) {
      case "stock_in":
      case "return":
        newQuantity = previousQuantity + input.quantity;
        guardCondition = undefined;
        break;
      case "stock_out":
        newQuantity = previousQuantity - input.quantity;
        guardCondition = and(
          eq(products.id, input.product_id),
          gte(products.quantity, input.quantity)
        );
        break;
      case "adjustment":
        newQuantity = input.quantity;
        guardCondition = undefined;
        break;
      default:
        throw new Error("Invalid movement type");
    }

    const [updated] = await tx
      .update(products)
      .set({ quantity: newQuantity, updated_at: new Date() })
      .where(guardCondition ?? eq(products.id, input.product_id))
      .returning();

    if (!updated) {
      throw new Error("Insufficient stock or product not found");
    }

    await tx
      .update(inventory)
      .set({ quantity: newQuantity, updated_at: new Date() })
      .where(eq(inventory.product_id, input.product_id));

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

  const where = params?.product_id
    ? eq(stock_movements.product_id, params.product_id)
    : undefined;

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
