"use server";

import { revalidatePath } from "next/cache";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/features/suppliers/services/supplier.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { supplierSchema, type SupplierInput } from "@/lib/validations";

export async function createSupplierAction(input: SupplierInput) {
  await requirePermission("suppliers:write");
  const data = supplierSchema.parse(input);
  const supplier = await createSupplier(data);
  revalidatePath("/suppliers");
  return supplier;
}

export async function updateSupplierAction(id: string, input: SupplierInput) {
  await requirePermission("suppliers:write");
  const data = supplierSchema.parse(input);
  const supplier = await updateSupplier(id, data);
  revalidatePath("/suppliers");
  return supplier;
}

export async function deleteSupplierAction(id: string) {
  await requirePermission("suppliers:write");
  await deleteSupplier(id);
  revalidatePath("/suppliers");
}
