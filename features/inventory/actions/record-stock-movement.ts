"use server";

import { revalidatePath } from "next/cache";
import { recordStockMovement } from "@/features/inventory/services/inventory.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { stockMovementSchema, stockAdjustmentSchema } from "@/lib/validations/stock";

interface StockMovementActionInput {
  product_id: string;
  type: "stock_in" | "stock_out" | "adjustment" | "return";
  quantity: number;
  notes?: string;
}

export async function recordStockMovementAction(input: StockMovementActionInput) {
  const profile = await requirePermission("stock_movements:write");

  // Validate the inputs securely on the server-side
  let validatedNotes = input.notes || "";
  let validatedQty = input.quantity;

  if (input.type === "adjustment") {
    const data = stockAdjustmentSchema.parse({
      product_id: input.product_id,
      new_quantity: input.quantity,
      notes: input.notes,
    });
    validatedQty = data.new_quantity;
    validatedNotes = data.notes || "";
  } else {
    const data = stockMovementSchema.parse({
      product_id: input.product_id,
      type: input.type,
      quantity: input.quantity,
      notes: input.notes,
    });
    validatedQty = data.quantity;
    validatedNotes = data.notes || "";
  }

  const movement = await recordStockMovement({
    product_id: input.product_id,
    type: input.type,
    quantity: validatedQty,
    notes: validatedNotes,
    user_id: profile.id,
  });

  // Revalidate related paths to update client views instantly
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath(`/products/${input.product_id}`);
  revalidatePath("/dashboard");

  return movement;
}
