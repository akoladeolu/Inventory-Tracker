import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProducts(params?: {
  search?: string;
  category_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
}) {
  const supabase = await createClient();
  const page = params?.page || 1;
  const per_page = params?.per_page || 20;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from("products")
    .select("*, categories(name)", { count: "exact" });

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
  }

  if (params?.category_id) {
    query = query.eq("category_id", params.category_id);
  }

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data || [],
    total: count || 0,
    page,
    per_page,
    totalPages: Math.ceil((count || 0) / per_page),
  };
}

export async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: {
  name: string;
  sku: string;
  category_id: string;
  brand?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold?: number;
  image_url?: string;
  description?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;

  // Create initial inventory record
  await supabase.from("inventory").insert({
    product_id: data.id,
    quantity: product.quantity,
  });

  // Create initial stock movement if quantity > 0
  if (product.quantity > 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (userProfile) {
        await supabase.from("stock_movements").insert({
          product_id: data.id,
          type: "stock_in",
          quantity: product.quantity,
          previous_quantity: 0,
          new_quantity: product.quantity,
          user_id: userProfile.id,
          notes: "Initial stock",
        });
      }
    }
  }

  revalidatePath("/products");
  return data;
}

export async function updateProduct(
  id: string,
  product: {
    name?: string;
    sku?: string;
    category_id?: string;
    brand?: string;
    cost_price?: number;
    selling_price?: number;
    low_stock_threshold?: number;
    image_url?: string;
    description?: string;
    status?: string;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/products");
  return data;
}

export async function archiveProduct(id: string) {
  return updateProduct(id, { status: "archived" });
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/products");
}
