"use server";

import { createSale } from "@/features/sales/services/sale.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { saleSchema } from "@/lib/validations/sale";
import { revalidatePath } from "next/cache";

interface SaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CreateSaleActionInput {
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card" | "transfer" | "mobile";
  items: SaleItemInput[];
}

export async function createSaleAction(input: CreateSaleActionInput) {
  const profile = await requirePermission("sales:write");

  // Validate the inputs securely on server-side
  const validated = saleSchema.parse(input);

  // Recalculate totals on the server to prevent data tampering
  const items = validated.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - validated.discount;

  const sale = await createSale({
    customer_name: validated.customer_name,
    customer_phone: validated.customer_phone,
    subtotal,
    discount: validated.discount,
    total,
    payment_method: validated.payment_method,
    items,
    user_id: profile.id,
  });

  // Revalidate related paths so that stock updates and dashboards sync instantly
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return sale;
}
