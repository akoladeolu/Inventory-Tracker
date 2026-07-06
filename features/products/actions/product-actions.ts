"use server";

import { revalidatePath } from "next/cache";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/features/products/services/product.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { productSchema, type ProductInput } from "@/lib/validations";

export async function createProductAction(input: ProductInput) {
  await requirePermission("products:write");
  const data = productSchema.parse(input);
  const product = await createProduct(data);
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return product;
}

export async function updateProductAction(id: string, input: ProductInput) {
  await requirePermission("products:write");
  const data = productSchema.parse(input);
  const product = await updateProduct(id, data);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return product;
}

export async function archiveProductAction(id: string) {
  await requirePermission("products:write");
  const product = await archiveProduct(id);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/dashboard");
  return product;
}

export async function deleteProductAction(id: string) {
  await requirePermission("products:delete");
  await deleteProduct(id);
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
