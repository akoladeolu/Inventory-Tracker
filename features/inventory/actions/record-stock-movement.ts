"use server";

import { recordStockMovement } from "@/features/inventory/services/inventory.service";
import { getUserProfile } from "@/lib/auth";

interface StockMovementActionInput {
  product_id: string;
  type: "stock_in" | "stock_out" | "adjustment" | "return";
  quantity: number;
  notes?: string;
}

export async function recordStockMovementAction(input: StockMovementActionInput) {
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error("Not authenticated");
  }

  const movement = await recordStockMovement({
    ...input,
    user_id: profile.id,
  });

  return movement;
}
