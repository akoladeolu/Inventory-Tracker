"use client";

import { motion } from "framer-motion";
import { Package, Warehouse, AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalProducts: number;
    totalInventory: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
    totalRevenue?: number;
    grossProfit?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue || 0),
      icon: TrendingUp,
      description: "Lifetime revenue",
      className: "border-primary/20 bg-primary/5",
    },
    {
      title: "Gross Profit",
      value: formatCurrency(stats.grossProfit || 0),
      icon: DollarSign,
      description: "Estimated profit",
      className: "border-success/20 bg-success/5 text-success",
    },
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={item}>
          <Card className={`h-full glassmorphism transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.className || ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary truncate pr-2">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-text-secondary shrink-0" />
            </CardHeader>
            <CardContent>
              <div 
                className={`text-xl xl:text-2xl font-black font-heading tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
                  card.alert ? "text-warning" : ""
                }`}
                title={String(card.value)}
              >
                {card.value}
              </div>
              <p className="text-[11px] text-text-secondary mt-1 font-medium truncate">{card.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
