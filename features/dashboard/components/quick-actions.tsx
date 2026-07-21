"use client";

import { motion } from "framer-motion";
import { PlusCircle, ShoppingCart, PackagePlus, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Record Sale",
      icon: ShoppingCart,
      href: "/sales",
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
    {
      label: "Receive Stock",
      icon: PackagePlus,
      href: "/inventory",
      color: "bg-surface text-foreground border hover:bg-muted",
    },
    {
      label: "Add Product",
      icon: PlusCircle,
      href: "/products",
      color: "bg-surface text-foreground border hover:bg-muted",
    },
    {
      label: "Transfer",
      icon: ArrowRightLeft,
      href: "/inventory",
      color: "bg-surface text-foreground border hover:bg-muted",
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, idx) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.3 }}
        >
          <Button
            className={`shadow-sm transition-all duration-300 hover:shadow-md ${action.color}`}
            onClick={() => router.push(action.href)}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
