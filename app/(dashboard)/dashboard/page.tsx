import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { RecentSales } from "@/features/dashboard/components/recent-sales";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { LowStockAlerts } from "@/features/dashboard/components/low-stock-alerts";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { stats, recentSales, recentActivity, lowStockProducts } =
    await getDashboardData();

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
        <RecentActivity activities={recentActivity as any} />
      </div>

      <LowStockAlerts products={lowStockProducts as any} />
    </div>
  );
}
