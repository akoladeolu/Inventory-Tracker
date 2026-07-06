"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface SalesSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalOrders: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
}

interface BestSellingProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  outOfStock: number;
  categoryBreakdown: { name: string; count: number; value: number }[];
}

interface DailySales {
  date: string;
  sales: number;
  revenue: number;
}

const REPORTS = [
  { key: "sales", title: "Sales Report", icon: TrendingUp, color: "text-success" },
  { key: "inventory", title: "Inventory Report", icon: Package, color: "text-info" },
  { key: "low-stock", title: "Low Stock Report", icon: AlertTriangle, color: "text-warning" },
  { key: "best-selling", title: "Best Selling Products", icon: BarChart3, color: "text-gold" },
];

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("sales");
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalOrders: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [bestSelling, setBestSelling] = useState<BestSellingProduct[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    outOfStock: 0,
    categoryBreakdown: [],
  });
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        const supabase = createClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [todayResult, weekResult, monthResult, totalResult, allSalesResult, lowStockResult, saleItemsResult, productsResult] = await Promise.all([
          supabase.from("sales").select("total").gte("created_at", today.toISOString()),
          supabase.from("sales").select("total").gte("created_at", weekStart.toISOString()),
          supabase.from("sales").select("total").gte("created_at", monthStart.toISOString()),
          supabase.from("sales").select("*", { count: "exact", head: true }),
          supabase.from("sales").select("total, created_at").gte("created_at", sevenDaysAgo.toISOString()),
          supabase.from("products").select("id, name, sku, quantity, low_stock_threshold").eq("status", "active").order("quantity", { ascending: true }),
          supabase.from("sale_items").select("product_id, quantity, total, products(name)").limit(1000),
          supabase.from("products").select("id, quantity, cost_price, categories(name)").eq("status", "active"),
        ]);

        setSalesSummary({
          today: todayResult.data?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
          thisWeek: weekResult.data?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
          thisMonth: monthResult.data?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
          totalOrders: totalResult.count || 0,
        });

        const dailyMap: Record<string, { sales: number; revenue: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("en-US", { weekday: "short" });
          dailyMap[key] = { sales: 0, revenue: 0 };
        }
        allSalesResult.data?.forEach((s) => {
          const d = new Date(s.created_at);
          const key = d.toLocaleDateString("en-US", { weekday: "short" });
          if (dailyMap[key]) {
            dailyMap[key].sales += 1;
            dailyMap[key].revenue += Number(s.total);
          }
        });
        setDailySales(Object.entries(dailyMap).map(([date, data]) => ({ date, ...data })));

        setLowStockProducts(
          (lowStockResult.data || []).filter((p) => p.quantity <= p.low_stock_threshold)
        );

        if (saleItemsResult.data) {
          const productSales: Record<string, { name: string; totalSold: number; revenue: number }> = {};
          saleItemsResult.data.forEach((item) => {
            const key = item.product_id;
            if (!productSales[key]) {
              productSales[key] = { name: (item.products as any)?.name || "Unknown", totalSold: 0, revenue: 0 };
            }
            productSales[key].totalSold += item.quantity;
            productSales[key].revenue += Number(item.total);
          });
          setBestSelling(
            Object.entries(productSales)
              .map(([id, data]) => ({ id, ...data }))
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 10)
          );
        }

        if (productsResult.data) {
          const all = productsResult.data;
          const categoryMap: Record<string, { name: string; count: number; value: number }> = {};
          all.forEach((p) => {
            const catName = (p.categories as any)?.name || "Uncategorized";
            if (!categoryMap[catName]) categoryMap[catName] = { name: catName, count: 0, value: 0 };
            categoryMap[catName].count += 1;
            categoryMap[catName].value += p.quantity * Number(p.cost_price);
          });
          setInventorySummary({
            totalProducts: all.length,
            totalStock: all.reduce((sum, p) => sum + p.quantity, 0),
            totalValue: all.reduce((sum, p) => sum + p.quantity * Number(p.cost_price), 0),
            outOfStock: all.filter((p) => p.quantity === 0).length,
            categoryBreakdown: Object.values(categoryMap),
          });
        }
      } catch {
        // Errors handled silently — data stays at defaults
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
        <p className="text-text-secondary">View business insights and analytics</p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((report) => (
          <Card
            key={report.key}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              activeReport === report.key ? "border-gold bg-gold/5" : ""
            }`}
            onClick={() => setActiveReport(report.key)}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <report.icon className={`h-8 w-8 ${report.color}`} />
              <div>
                <CardTitle className="text-sm font-medium">{report.title}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          {/* SALES REPORT */}
          {activeReport === "sales" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Today&apos;s Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${salesSummary.today.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${salesSummary.thisWeek.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${salesSummary.thisMonth.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{salesSummary.totalOrders}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailySales.every((d) => d.revenue === 0) ? (
                    <p className="py-8 text-center text-text-secondary">No sales data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailySales}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--surface))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981" }}
                          name="Revenue ($)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* INVENTORY REPORT */}
          {activeReport === "inventory" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Total Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{inventorySummary.totalProducts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Total Stock Units
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{inventorySummary.totalStock}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Inventory Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-success">
                      ${inventorySummary.totalValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-text-secondary">
                      Out of Stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-error">
                      {inventorySummary.outOfStock}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stock by Category Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventorySummary.categoryBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-text-secondary">No products yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={inventorySummary.categoryBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--surface))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" name="Products" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Value by Category Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Value by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventorySummary.categoryBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-text-secondary">No products yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={inventorySummary.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          outerRadius={100}
                          dataKey="value"
                        >
                          {inventorySummary.categoryBreakdown.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--surface))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* LOW STOCK REPORT */}
          {activeReport === "low-stock" && (
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="py-8 text-center text-text-secondary">
                    All products are well stocked
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-text-secondary">{product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              product.quantity === 0 ? "text-error" : "text-warning"
                            }`}
                          >
                            {product.quantity}
                          </p>
                          <p className="text-xs text-text-secondary">
                            / {product.low_stock_threshold}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* BEST SELLING REPORT */}
          {activeReport === "best-selling" && (
            <Card>
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {bestSelling.length === 0 ? (
                  <p className="py-8 text-center text-text-secondary">No sales data yet</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bestSelling} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--surface))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-3">
                      {bestSelling.map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-text-secondary">
                                {product.totalSold} units sold
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-success">
                            ${product.revenue.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
