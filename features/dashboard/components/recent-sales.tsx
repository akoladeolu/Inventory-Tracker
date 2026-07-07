"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total: string | number;
  payment_method: string;
  created_at: string | Date;
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Sales</CardTitle>
        <Link
          href="/sales"
          className="text-sm font-medium text-gold hover:text-gold-hover"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="py-8 text-center text-text-secondary">No sales yet</p>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {sale.customer_name || "Walk-in Customer"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {sale.invoice_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-heading text-success">
                    {formatCurrency(sale.total)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {sale.payment_method}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
