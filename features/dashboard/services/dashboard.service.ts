import { db } from "@/lib/db";
import { products, sales, stock_movements, users } from "@/lib/db/schema";
import { eq, sql, lte, and } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

function getFallbackSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function getDashboardStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [stats] = await db
      .select({
        totalProducts:
          sql<number>`count(*) filter (where ${products.status} = 'active')::int`,
        totalInventory:
          sql<number>`coalesce(sum(${products.quantity}) filter (where ${products.status} = 'active'), 0)::int`,
        lowStockCount:
          sql<number>`count(*) filter (where ${products.status} = 'active' and ${products.quantity} > 0 and ${products.quantity} <= ${products.low_stock_threshold})::int`,
        outOfStockCount:
          sql<number>`count(*) filter (where ${products.status} = 'active' and ${products.quantity} = 0)::int`,
        inventoryValue:
          sql<number>`coalesce(sum(${products.cost_price}::numeric * ${products.quantity}) filter (where ${products.status} = 'active'), 0)`,
      })
      .from(products);

    const [revenueStats] = await db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${sales.total}::numeric), 0)`,
        todaySales: sql<number>`coalesce(sum(${sales.total}::numeric) filter (where ${sales.created_at} >= ${todayStart}), 0)`,
        todayOrdersCount: sql<number>`count(*) filter (where ${sales.created_at} >= ${todayStart})::int`,
      })
      .from(sales);

    return {
      totalProducts: stats?.totalProducts ?? 0,
      totalInventory: stats?.totalInventory ?? 0,
      lowStockCount: stats?.lowStockCount ?? 0,
      outOfStockCount: stats?.outOfStockCount ?? 0,
      inventoryValue: Number(stats?.inventoryValue ?? 0),
      totalRevenue: Number(revenueStats?.totalRevenue ?? 0),
      todaySales: Number(revenueStats?.todaySales ?? 0),
      todayOrdersCount: revenueStats?.todayOrdersCount ?? 0,
      grossProfit: Number(revenueStats?.totalRevenue ?? 0) * 0.3,
    };
  } catch (err) {
    console.warn("Drizzle stats query failed, using Supabase REST fallback:", err);
    const supabase = getFallbackSupabase();
    
    const { data: productsList } = await supabase.from("products").select("quantity, cost_price, low_stock_threshold, status");
    const activeProducts = (productsList || []).filter(p => p.status === 'active');
    
    const totalProducts = activeProducts.length;
    const totalInventory = activeProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockCount = activeProducts.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.low_stock_threshold || 5)).length;
    const outOfStockCount = activeProducts.filter(p => (p.quantity || 0) === 0).length;
    const inventoryValue = activeProducts.reduce((sum, p) => sum + ((p.quantity || 0) * Number(p.cost_price || 0)), 0);

    const { data: salesList } = await supabase.from("sales").select("total, created_at");
    const totalRevenue = (salesList || []).reduce((sum, s) => sum + Number(s.total || 0), 0);

    const todayStartIso = new Date();
    todayStartIso.setHours(0, 0, 0, 0);
    const todaySalesList = (salesList || []).filter(s => new Date(s.created_at) >= todayStartIso);
    const todaySales = todaySalesList.reduce((sum, s) => sum + Number(s.total || 0), 0);

    return {
      totalProducts,
      totalInventory,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      totalRevenue,
      todaySales,
      todayOrdersCount: todaySalesList.length,
      grossProfit: totalRevenue * 0.3,
    };
  }
}

export async function getRecentSales(limit = 5) {
  try {
    return await db
      .select()
      .from(sales)
      .orderBy(sql`${sales.created_at} desc`)
      .limit(limit);
  } catch (err) {
    console.warn("Drizzle recent sales query failed, using Supabase REST fallback:", err);
    const supabase = getFallbackSupabase();
    const { data } = await supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(limit);
    return data || [];
  }
}

export async function getRecentActivity(limit = 5) {
  try {
    const data = await db
      .select({
        id: stock_movements.id,
        type: stock_movements.type,
        quantity: stock_movements.quantity,
        notes: stock_movements.notes,
        created_at: stock_movements.created_at,
        products: {
          name: products.name,
        },
        users: {
          name: users.name,
        },
      })
      .from(stock_movements)
      .leftJoin(products, eq(stock_movements.product_id, products.id))
      .leftJoin(users, eq(stock_movements.user_id, users.id))
      .orderBy(sql`${stock_movements.created_at} desc`)
      .limit(limit);

    return data;
  } catch (err) {
    console.warn("Drizzle recent activity query failed, using Supabase REST fallback:", err);
    const supabase = getFallbackSupabase();
    const { data } = await supabase
      .from("stock_movements")
      .select("id, type, quantity, notes, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).map((sm: any) => ({
      id: sm.id,
      type: sm.type,
      quantity: sm.quantity,
      notes: sm.notes,
      created_at: sm.created_at,
      products: sm.products ? { name: sm.products.name } : null,
      users: null
    }));
  }
}

export async function getLowStockProducts(limit = 8) {
  try {
    return await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        quantity: products.quantity,
        low_stock_threshold: products.low_stock_threshold,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          lte(products.quantity, products.low_stock_threshold)
        )
      )
      .orderBy(products.quantity)
      .limit(limit);
  } catch (err) {
    console.warn("Drizzle low stock query failed, using Supabase REST fallback:", err);
    const supabase = getFallbackSupabase();
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, quantity, low_stock_threshold")
      .eq("status", "active")
      .order("quantity", { ascending: true })
      .limit(limit);

    return (data || []).filter((p: any) => p.quantity <= p.low_stock_threshold);
  }
}

// All dashboard data in 4 parallel queries — replaces the useEffect waterfall
// Each query is wrapped so a single table failure doesn't crash the whole dashboard
export async function getDashboardData() {
  const results = await Promise.allSettled([
    getDashboardStats(),
    getRecentSales(5),
    getRecentActivity(5),
    getLowStockProducts(8),
  ]);

  const stats =
    results[0].status === "fulfilled"
      ? results[0].value
      : {
          totalProducts: 0,
          totalInventory: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          inventoryValue: 0,
          totalRevenue: 0,
          todaySales: 0,
          todayOrdersCount: 0,
          grossProfit: 0,
        };

  const recentSales =
    results[1].status === "fulfilled" ? results[1].value : [];

  const recentActivity =
    results[2].status === "fulfilled" ? results[2].value : [];

  const lowStockProducts =
    results[3].status === "fulfilled" ? results[3].value : [];

  return { stats, recentSales, recentActivity, lowStockProducts };
}
