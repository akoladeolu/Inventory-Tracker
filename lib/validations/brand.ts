import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().default(""),
});

export type BrandInput = z.infer<typeof brandSchema>;
