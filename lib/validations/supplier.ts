import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(255, "Name must be less than 255 characters"),
  contact_person: z.string().max(255, "Contact person must be less than 255 characters").default(""),
  email: z.string().email("Please enter a valid email address").or(z.literal("")).default(""),
  phone: z.string().max(50, "Phone must be less than 50 characters").default(""),
  address: z.string().default(""),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
