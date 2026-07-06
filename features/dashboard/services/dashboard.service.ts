import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Get total products
  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get total inventory quantity
  const { data: inventoryData } = await supabase
    .from("products")
    .select("quantity")
    .eq("status", "active");

  const totalInventory = inventoryData?.reduce((sum, p) => sum + p.quantity, 0) || 0;

  // Get low stock count
  const { data: lowStockData } = await supabase
    .from("products")
    .select("id")
    .eq("status", "active")
    .filter("quantity", "lte", "low_stock_threshold");

  const lowStockCount = lowStockData?.length || 0;

  // Get out of stock count
  const { count: outOfStockCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .eq("quantity", 0);

  // Get inventory value
  const { data: inventoryValueData } = await supabase
    .from("products")
    .select("cost_price, quantity")
    .eq("status", "active");

  const inventoryValue = inventoryValueData?.reduce(
    (sum, p) => sum + Number(p.cost_price) * p.quantity,
    0
  ) || 0;

  return {
    totalProducts: totalProducts || 0,
    totalInventory,
    lowStockCount,
    outOfStockCount: outOfStockCount || 0,
    inventoryValue,
  };
}

export async function getRecentSales(limit = 10) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getRecentActivity(limit = 10) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stock_movements")
    .select(`
      *,
      products (name),
      users (name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getLowStockProducts(limit = 10) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("id, name, sku, quantity, low_stock_threshold, categories(name)")
    .eq("status", "active")
    .filter("quantity", "lte", "low_stock_threshold")
    .order("quantity", { ascending: true })
    .limit(limit);

  return data || [];
}
