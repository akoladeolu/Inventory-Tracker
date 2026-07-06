import { z } from "zod";

const saleItemSchema = z.object({
  product_id: z.string().uuid("Please select a valid product"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price must be positive"),
});

export const saleSchema = z.object({
  customer_name: z.string().max(255, "Name must be less than 255 characters").optional().default(""),
  customer_phone: z.string().max(50, "Phone must be less than 50 characters").optional().default(""),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  discount: z.number().min(0, "Discount must be non-negative").default(0),
  payment_method: z.enum(["cash", "card", "transfer", "mobile"]).default("cash"),
});

export const saleSearchSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  payment_method: z.enum(["cash", "card", "transfer", "mobile"]).optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export type SaleInput = z.infer<typeof saleSchema>;
export type SaleSearchInput = z.infer<typeof saleSearchSchema>;
