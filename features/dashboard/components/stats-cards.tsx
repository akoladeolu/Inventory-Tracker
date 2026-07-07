"use client";

import { Package, Warehouse, AlertTriangle, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalProducts: number;
    totalInventory: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active products",
    },
    {
      title: "Total Inventory",
      value: stats.totalInventory.toLocaleString(),
      icon: Warehouse,
      description: "Units in stock",
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: "Below threshold",
      alert: stats.lowStockCount > 0,
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount,
      icon: ShoppingCart,
      description: "Zero quantity",
      alert: stats.outOfStockCount > 0,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.inventoryValue),
      icon: DollarSign,
      description: "Total cost value",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-heading tracking-tight ${card.alert ? "text-warning" : ""}`}>
              {card.value}
            </div>
            <p className="text-xs text-text-secondary mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
