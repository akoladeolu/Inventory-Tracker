"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  type: string;
  quantity: number;
  notes: string;
  created_at: string;
  products: { name: string } | null;
  users: { name: string } | null;
}

interface RecentActivityProps {
  activities: Activity[];
}

const typeConfig: Record<string, { label: string; className: string }> = {
  stock_in: { label: "Stock In", className: "bg-success/10 text-success" },
  stock_out: { label: "Stock Out", className: "bg-error/10 text-error" },
  adjustment: { label: "Adjustment", className: "bg-info/10 text-info" },
  sale: { label: "Sale", className: "bg-gold/10 text-gold" },
  return: { label: "Return", className: "bg-warning/10 text-warning" },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = typeConfig[activity.type] || typeConfig.adjustment;
              return (
                <div
                  key={activity.id}
                  className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={config.className}>{config.label}</Badge>
                      <span className="text-sm font-medium truncate">
                        {activity.products?.name || "Unknown Product"}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      by {activity.users?.name || "System Staff"} • {activity.notes}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold font-heading ${
                        activity.type === "stock_in" || activity.type === "return"
                          ? "text-success"
                          : activity.type === "stock_out" || activity.type === "sale"
                          ? "text-error"
                          : "text-info"
                      }`}
                    >
                      {activity.type === "stock_in" || activity.type === "return"
                        ? "+"
                        : "-"}
                      {activity.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
