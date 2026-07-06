import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name must be less than 100 characters"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
