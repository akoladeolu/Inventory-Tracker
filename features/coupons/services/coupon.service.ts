import { eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import type { CouponInput } from "@/lib/validations";

export async function getCoupons() {
  return db.select().from(coupons).orderBy(sql`${coupons.created_at} DESC`);
}

export async function createCoupon(input: CouponInput) {
  // Convert dates if provided as strings
  const values: any = {
    ...input,
    discount_value: input.discount_value.toString(),
    min_purchase_amount: input.min_purchase_amount.toString(),
    max_discount_amount: input.max_discount_amount ? input.max_discount_amount.toString() : null,
    start_date: input.start_date ? new Date(input.start_date) : new Date(),
    end_date: input.end_date ? new Date(input.end_date) : null,
  };

  const [coupon] = await db.insert(coupons).values(values).returning();
  return coupon;
}

export async function updateCoupon(id: string, input: Partial<CouponInput> & { active?: boolean }) {
  const updateData: any = {
    updated_at: new Date(),
  };

  if (input.code !== undefined) updateData.code = input.code;
  if (input.discount_type !== undefined) updateData.discount_type = input.discount_type;
  if (input.discount_value !== undefined) updateData.discount_value = input.discount_value.toString();
  if (input.min_purchase_amount !== undefined) updateData.min_purchase_amount = input.min_purchase_amount.toString();
  if (input.max_discount_amount !== undefined) updateData.max_discount_amount = input.max_discount_amount ? input.max_discount_amount.toString() : null;
  if (input.active !== undefined) updateData.active = input.active;
  if (input.start_date !== undefined) updateData.start_date = input.start_date ? new Date(input.start_date) : undefined;
  if (input.end_date !== undefined) updateData.end_date = input.end_date ? new Date(input.end_date) : null;
  if (input.usage_limit !== undefined) updateData.usage_limit = input.usage_limit;

  const [coupon] = await db
    .update(coupons)
    .set(updateData)
    .where(eq(coupons.id, id))
    .returning();

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
}

export async function deleteCoupon(id: string) {
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function validateCouponCode(code: string, purchaseAmount: number) {
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(sql`upper(${coupons.code})`, code.trim().toUpperCase()))
    .limit(1);

  if (!coupon) {
    throw new Error("Coupon code not found");
  }

  if (!coupon.active) {
    throw new Error("Coupon code is inactive");
  }

  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    throw new Error("Coupon code is not yet active");
  }

  if (coupon.end_date && new Date(coupon.end_date) < now) {
    throw new Error("Coupon code has expired");
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    throw new Error("Coupon code usage limit reached");
  }

  if (Number(purchaseAmount) < Number(coupon.min_purchase_amount)) {
    throw new Error(`Minimum purchase amount of ₦${Number(coupon.min_purchase_amount).toLocaleString()} required to use this coupon`);
  }

  return coupon;
}
