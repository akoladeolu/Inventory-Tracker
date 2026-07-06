"use server";

import { recordStockMovement } from "@/features/inventory/services/inventory.service";
import { requirePermission } from "@/lib/auth/server-permissions";

interface StockMovementActionInput {
  product_id: string;
  type: "stock_in" | "stock_out" | "adjustment" | "return";
  quantity: number;
  notes?: string;
}

export async function recordStockMovementAction(input: StockMovementActionInput) {
  const profile = await requirePermission("stock_movements:write");

  const movement = await recordStockMovement({
    ...input,
    user_id: profile.id,
  });

  return movement;
}
