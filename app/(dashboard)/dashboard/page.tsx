import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { RecentSales } from "@/features/dashboard/components/recent-sales";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { LowStockAlerts } from "@/features/dashboard/components/low-stock-alerts";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { SalesChart } from "@/features/dashboard/components/sales-chart";
import { MobileAppBanner } from "@/features/dashboard/components/mobile-app-banner";
import { getDashboardData } from "@/features/dashboard/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { stats, recentSales, recentActivity, lowStockProducts } =
    await getDashboardData();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-charcoal tracking-tight">Overview</h1>
          <p className="text-text-secondary mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your inventory today.
          </p>
        </div>
        <QuickActions />
      </div>

      <MobileAppBanner />

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="lg:col-span-1">
          <RecentSales sales={recentSales} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockAlerts products={lowStockProducts as any} />
        <RecentActivity activities={recentActivity as any} />
      </div>
    </div>
  );
}
