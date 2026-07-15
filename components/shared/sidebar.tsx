"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Award,
  Warehouse,
  ShoppingCart,
  Ticket,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/auth/hooks/use-permissions";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "products:read" },
  { name: "Products", href: "/products", icon: Package, permission: "products:read" },
  { name: "Categories", href: "/categories", icon: Tags, permission: "categories:read" },
  { name: "Brands", href: "/brands", icon: Award, permission: "categories:read" },
  { name: "Inventory", href: "/inventory", icon: Warehouse, permission: "inventory:read" },
  { name: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales:read" },
  { name: "Coupons", href: "/coupons", icon: Ticket, permission: "sales:read" },
  { name: "Suppliers", href: "/suppliers", icon: Truck, permission: "suppliers:read" },
  { name: "Reports", href: "/reports", icon: BarChart3, permission: "reports:read" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings:read" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { checkPermission } = usePermissions();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-charcoal transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-soft-black px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gold font-heading tracking-wide">TEEKEH</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-2 text-gray-400 hover:bg-soft-black hover:text-white"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation
          .filter((item) => checkPermission(item.permission))
          .map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-gray-400 hover:bg-soft-black hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-soft-black p-4">
          <p className="text-xs text-gray-500">Inventory Tracker v1.0</p>
        </div>
      )}
    </aside>
  );
}
