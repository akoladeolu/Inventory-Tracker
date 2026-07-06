"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { RecentSales } from "@/features/dashboard/components/recent-sales";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { LowStockAlerts } from "@/features/dashboard/components/low-stock-alerts";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInventory: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inventoryValue: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch products for stats
      const { data: products } = await supabase
        .from("products")
        .select("id, quantity, cost_price, low_stock_threshold, status")
        .eq("status", "active");

      if (products) {
        const totalProducts = products.length;
        const totalInventory = products.reduce((sum, p) => sum + p.quantity, 0);
        const lowStockCount = products.filter(
          (p) => p.quantity <= p.low_stock_threshold && p.quantity > 0
        ).length;
        const outOfStockCount = products.filter((p) => p.quantity === 0).length;
        const inventoryValue = products.reduce(
          (sum, p) => sum + Number(p.cost_price) * p.quantity,
          0
        );

        setStats({
          totalProducts,
          totalInventory,
          lowStockCount,
          outOfStockCount,
          inventoryValue,
        });
      }

      // Fetch recent sales
      const { data: sales } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (sales) setRecentSales(sales as any);

      // Fetch recent activity
      const { data: activity } = await supabase
        .from("stock_movements")
        .select(`
          *,
          products (name),
          users (name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activity) setRecentActivity(activity as any);

      // Fetch low stock products
      const { data: lowStock } = await supabase
        .from("products")
        .select("id, name, sku, quantity, low_stock_threshold, categories(name)")
        .eq("status", "active")
        .filter("quantity", "lte", "low_stock_threshold")
        .order("quantity", { ascending: true })
        .limit(5);

      if (lowStock) setLowStockProducts(lowStock as any);

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
        <p className="text-text-secondary">
          Welcome back! Here&apos;s an overview of your inventory.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSales sales={recentSales} />
        <RecentActivity activities={recentActivity} />
      </div>

      <LowStockAlerts products={lowStockProducts} />
    </div>
  );
}
