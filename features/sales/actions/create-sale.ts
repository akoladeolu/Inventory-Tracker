"use server";

import { createSale } from "@/features/sales/services/sale.service";
import { getUserProfile } from "@/lib/auth";

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
  const profile = await getUserProfile();
  if (!profile) {
    throw new Error("Not authenticated");
  }

  const sale = await createSale({
    ...input,
    user_id: profile.id,
  });

  return sale;
}
