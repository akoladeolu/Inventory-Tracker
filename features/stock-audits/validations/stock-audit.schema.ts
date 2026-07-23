import { z } from 'zod';

export const createAuditSchema = z.object({
  scope: z.enum(['full', 'category', 'brand']),
  scope_filter: z.object({
    category_id: z.string().uuid().optional(),
    brand_id: z.string().uuid().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

export const updateCountSchema = z.object({
  counted_quantity: z.number().int().min(0, 'Count must be 0 or more'),
  variance_reason: z.enum([
    'damaged',
    'stolen',
    'misplaced',
    'display_sample',
    'counting_error',
    'other',
  ]).optional(),
  variance_notes: z.string().max(500).optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateCountInput = z.infer<typeof updateCountSchema>;
