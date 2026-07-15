import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Coupon code is required")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code must be alphanumeric, uppercase, and can contain dashes or underscores"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number({ invalid_type_error: "Discount value must be a valid number" }).min(0, "Value must be positive"),
  min_purchase_amount: z
    .number({ invalid_type_error: "Min purchase must be a valid number" })
    .min(0, "Min purchase must be positive")
    .default(0),
  max_discount_amount: z
    .number({ invalid_type_error: "Max discount must be a valid number" })
    .min(0, "Max discount must be positive")
    .optional()
    .nullable(),
  active: z.boolean().default(true),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  usage_limit: z
    .number({ invalid_type_error: "Usage limit must be a valid number" })
    .int()
    .min(1, "Usage limit must be at least 1")
    .optional()
    .nullable(),
});

export type CouponInput = z.infer<typeof couponSchema>;
