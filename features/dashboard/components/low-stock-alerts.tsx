"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  categories: { name: string } | null;
}

interface LowStockAlertsProps {
  products: LowStockProduct[];
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
        <Link
          href="/inventory"
          className="text-sm font-medium text-gold hover:text-gold-hover"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">
            All products are well stocked
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-text-secondary">
                    {product.sku} • {product.categories?.name || "No category"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold font-heading ${
                      product.quantity === 0 ? "text-error" : "text-warning"
                    }`}
                  >
                    {product.quantity}
                  </p>
                  <p className="text-xs text-text-secondary font-heading">
                    / {product.low_stock_threshold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
