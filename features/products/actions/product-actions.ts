"use server";

import { revalidatePath } from "next/cache";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/features/products/services/product.service";
import { productSchema, type ProductInput } from "@/lib/validations";
import { logActivity } from "@/lib/utils/activity-logger";
import { requirePermission } from "@/lib/auth/server-permissions";

export async function createProductAction(input: ProductInput) {
  await requirePermission("products:write");
  const data = productSchema.parse(input);
  const product = await createProduct(data);
  await logActivity("create", "product", product.id, `Created product "${product.name}" with SKU ${product.sku}`);
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return product;
}

export async function updateProductAction(id: string, input: ProductInput) {
  await requirePermission("products:write");
  const data = productSchema.parse(input);
  const product = await updateProduct(id, data);
  await logActivity("update", "product", product.id, `Updated product "${product.name}" details`);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return product;
}

export async function archiveProductAction(id: string) {
  await requirePermission("products:write");
  const product = await archiveProduct(id);
  await logActivity("archive", "product", product.id, `Archived product "${product.name}"`);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/dashboard");
  return product;
}

export async function deleteProductAction(id: string) {
  await requirePermission("products:delete");
  await deleteProduct(id);
  await logActivity("delete", "product", id, `Deleted product with ID ${id}`);
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
