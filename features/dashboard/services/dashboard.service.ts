import { db } from "@/lib/db";
import { products, sales, stock_movements, users } from "@/lib/db/schema";
import { eq, sql, lte, and } from "drizzle-orm";

export async function getDashboardStats() {
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
}

export async function getRecentSales(limit = 5) {
  return db
    .select()
    .from(sales)
    .orderBy(sql`${sales.created_at} desc`)
    .limit(limit);
}

export async function getRecentActivity(limit = 5) {
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
}

export async function getLowStockProducts(limit = 8) {
  // Proper column-to-column comparison — fixes the broken string literal bug
  return db
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
        };

  const recentSales =
    results[1].status === "fulfilled" ? results[1].value : [];

  const recentActivity =
    results[2].status === "fulfilled" ? results[2].value : [];

  const lowStockProducts =
    results[3].status === "fulfilled" ? results[3].value : [];

  return { stats, recentSales, recentActivity, lowStockProducts };
}
