import { z } from "zod";

export const stockMovementSchema = z.object({
  product_id: z.string().uuid("Please select a valid product"),
  type: z.enum(["stock_in", "stock_out", "adjustment", "sale", "return"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().optional().default(""),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.string().uuid("Please select a valid product"),
  new_quantity: z.number().int().min(0, "Quantity must be non-negative"),
  notes: z.string().optional().default(""),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
