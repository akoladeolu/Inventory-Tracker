"use server";

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/services/category.service";
import { requirePermission } from "@/lib/auth/server-permissions";
import { categorySchema, type CategoryInput } from "@/lib/validations";

export async function createCategoryAction(input: CategoryInput) {
  try {
    await requirePermission("categories:write");
    const data = categorySchema.parse(input);
    const category = await createCategory(data.name);
    return { success: true, data: category };
  } catch (err: any) {
    console.error("Error in createCategoryAction:", err);
    return { success: false, error: err.message || "Failed to create category" };
  }
}

export async function updateCategoryAction(id: string, input: CategoryInput) {
  try {
    await requirePermission("categories:write");
    const data = categorySchema.parse(input);
    const category = await updateCategory(id, data.name);
    return { success: true, data: category };
  } catch (err: any) {
    console.error("Error in updateCategoryAction:", err);
    return { success: false, error: err.message || "Failed to update category" };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await requirePermission("categories:delete");
    await deleteCategory(id);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteCategoryAction:", err);
    return { success: false, error: err.message || "Failed to delete category" };
  }
}

