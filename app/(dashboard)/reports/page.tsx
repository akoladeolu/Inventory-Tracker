"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ReportCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

const reports: ReportCard[] = [
  {
    title: "Sales Report",
    description: "View daily, weekly, and monthly sales data",
    icon: TrendingUp,
    href: "#sales",
    color: "text-success",
  },
  {
    title: "Inventory Report",
    description: "Complete inventory overview with stock levels",
    icon: Package,
    href: "#inventory",
    color: "text-info",
  },
  {
    title: "Low Stock Report",
    description: "Products that need restocking",
    icon: AlertTriangle,
    href: "#low-stock",
    color: "text-warning",
  },
  {
    title: "Best Selling Products",
    description: "Top performing products by revenue",
    icon: BarChart3,
    href: "#best-selling",
    color: "text-gold",
  },
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      const supabase = createClient();

      // Sales summary
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", today.toISOString());

      const { data: weekSales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", weekStart.toISOString());

      const { data: monthSales } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", monthStart.toISOString());

      const { count: totalOrders } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true });

      setSalesSummary({
        today: todaySales?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
        thisWeek: weekSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
        thisMonth: monthSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0,
        totalOrders: totalOrders || 0,
      });

      // Low stock
      const { data: lowStock } = await supabase
        .from("products")
        .select("id, name, sku, quantity, low_stock_threshold")
        .eq("status", "active")
        .filter("quantity", "lte", "low_stock_threshold")
        .order("quantity", { ascending: true });

      setLowStockProducts(lowStock || []);

      // Best selling (from sale_items)
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("product_id, quantity, total, products(name)")
        .limit(1000);

      if (saleItems) {
        const productSales: Record<string, { name: string; totalSold: number; revenue: number }> = {};
        saleItems.forEach((item) => {
          const key = item.product_id;
          if (!productSales[key]) {
            productSales[key] = {
              name: (item.products as any)?.name || "Unknown",
              totalSold: 0,
              revenue: 0,
            };
          }
          productSales[key].totalSold += item.quantity;
          productSales[key].revenue += Number(item.total);
        });

        const sorted = Object.entries(productSales)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        setBestSelling(sorted);
      }

      setLoading(false);
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
        {reports.map((report) => (
          <Card
            key={report.title}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              activeReport === report.href.slice(1)
                ? "border-gold bg-gold/5"
                : ""
            }`}
            onClick={() => setActiveReport(report.href.slice(1))}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <report.icon className={`h-8 w-8 ${report.color}`} />
              <div>
                <CardTitle className="text-sm font-medium">
                  {report.title}
                </CardTitle>
                <p className="text-xs text-text-secondary">
                  {report.description}
                </p>
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
          {activeReport === "sales" && (
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
          )}

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

          {activeReport === "best-selling" && (
            <Card>
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {bestSelling.length === 0 ? (
                  <p className="py-8 text-center text-text-secondary">
                    No sales data yet
                  </p>
                ) : (
                  <div className="space-y-3">
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
                )}
              </CardContent>
            </Card>
          )}

          {activeReport === "inventory" && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-text-secondary">
                  Detailed inventory report coming soon. Use the Inventory page for current stock levels.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
