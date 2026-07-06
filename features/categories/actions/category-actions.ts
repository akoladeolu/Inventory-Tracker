"use server";

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/services/category.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { categorySchema, type CategoryInput } from "@/lib/validations";

export async function createCategoryAction(input: CategoryInput) {
  await requirePermission("categories:write");
  const data = categorySchema.parse(input);
  return createCategory(data.name);
}

export async function updateCategoryAction(id: string, input: CategoryInput) {
  await requirePermission("categories:write");
  const data = categorySchema.parse(input);
  return updateCategory(id, data.name);
}

export async function deleteCategoryAction(id: string) {
  await requirePermission("categories:delete");
  return deleteCategory(id);
}
