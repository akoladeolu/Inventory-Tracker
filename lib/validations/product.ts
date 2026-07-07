import { z } from "zod";

const pricePreprocess = (val: unknown) => {
  if (val === "" || val === undefined || val === null) return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const cleaned = val.replace(/,/g, "");
    if (cleaned === "") return undefined;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
};

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name must be less than 255 characters"),
  sku: z.string().min(1, "SKU is required").max(100, "SKU must be less than 100 characters"),
  category_id: z.string().uuid("Please select a valid category"),
  brand: z.string().max(255, "Brand must be less than 255 characters").optional().default(""),
  cost_price: z.preprocess(
    pricePreprocess,
    z.number({ invalid_type_error: "Cost price must be a valid number" }).min(0, "Cost price must be positive")
  ),
  selling_price: z.preprocess(
    pricePreprocess,
    z.number({ invalid_type_error: "Selling price must be a valid number" }).min(0, "Selling price must be positive")
  ),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  low_stock_threshold: z.number().int().min(0, "Threshold must be non-negative").default(10),
  image_url: z.string().url("Please enter a valid URL").optional().nullable(),
  description: z.string().optional().default(""),
  status: z.enum(["active", "archived"]).default("active"),
});

export const productSearchSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(["active", "archived"]).optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(20),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
