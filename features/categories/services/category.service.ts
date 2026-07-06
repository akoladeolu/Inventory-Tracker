import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/categories");
  return data;
}

export async function updateCategory(id: string, name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/categories");
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  // Check if category has products
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count && count > 0) {
    throw new Error("Cannot delete category with products");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/categories");
}
