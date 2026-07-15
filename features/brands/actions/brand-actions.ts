"use server";

import { revalidatePath } from "next/cache";
import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "@/features/brands/services/brand.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { logActivity } from "@/lib/utils/activity-logger";

export async function createBrandAction(input: BrandInput) {
  await requirePermission("categories:write");
  const data = brandSchema.parse(input);
  const brand = await createBrand(data);
  await logActivity("create", "brand", brand.id, `Created brand "${brand.name}"`);
  revalidatePath("/brands");
  revalidatePath("/products");
  return brand;
}

export async function updateBrandAction(id: string, input: BrandInput) {
  await requirePermission("categories:write");
  const data = brandSchema.parse(input);
  const brand = await updateBrand(id, data);
  await logActivity("update", "brand", brand.id, `Updated brand "${brand.name}"`);
  revalidatePath("/brands");
  revalidatePath("/products");
  return brand;
}

export async function deleteBrandAction(id: string) {
  await requirePermission("categories:write");
  await deleteBrand(id);
  await logActivity("delete", "brand", id, `Deleted brand with ID ${id}`);
  revalidatePath("/brands");
  revalidatePath("/products");
}
