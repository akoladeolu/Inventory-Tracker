"use server";

import { revalidatePath } from "next/cache";
import {
  createCoupon,
  deleteCoupon,
  updateCoupon,
  validateCouponCode,
} from "@/features/coupons/services/coupon.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { couponSchema, type CouponInput } from "@/lib/validations";
import { logActivity } from "@/lib/utils/activity-logger";

export async function createCouponAction(input: CouponInput) {
  await requirePermission("categories:write");
  const data = couponSchema.parse(input);
  const coupon = await createCoupon(data);
  await logActivity("create", "coupon", coupon.id, `Created coupon "${coupon.code}"`);
  revalidatePath("/coupons");
  return coupon;
}

export async function toggleCouponActiveAction(id: string, active: boolean) {
  await requirePermission("categories:write");
  const coupon = await updateCoupon(id, { active });
  await logActivity("update", "coupon", coupon.id, `Toggled coupon "${coupon.code}" active to ${active}`);
  revalidatePath("/coupons");
  return coupon;
}

export async function deleteCouponAction(id: string) {
  await requirePermission("categories:write");
  await deleteCoupon(id);
  await logActivity("delete", "coupon", id, `Deleted coupon with ID ${id}`);
  revalidatePath("/coupons");
}

export async function validateCouponAction(code: string, purchaseAmount: number) {
  await requirePermission("sales:write");
  try {
    const coupon = await validateCouponCode(code, purchaseAmount);
    return {
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to validate coupon",
    };
  }
}
