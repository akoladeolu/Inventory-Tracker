"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-full"
    >
      <Card className="h-full glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Sales</CardTitle>
          <Link
            href="/sales"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No Sales Yet"
              description="Your recent sales will appear here."
            />
          ) : (
            <div className="space-y-4">
              {sales.map((sale, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  key={sale.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 hover:bg-muted/30 p-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <p className="text-sm font-medium truncate">
                      {sale.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {sale.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-heading text-success">
                      {formatCurrency(sale.total)}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {sale.payment_method}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
