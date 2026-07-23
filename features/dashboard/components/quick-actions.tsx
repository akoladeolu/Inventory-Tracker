"use client";

import { motion } from "framer-motion";
import { PlusCircle, ShoppingCart, PackagePlus, ArrowRightLeft, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();
  const apkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "/teekeh-scanner.apk";

  const handleGetMobileApp = () => {
    // Re-enable banner if dismissed so user can also scan QR code if needed
    localStorage.removeItem("teekeh_mobile_banner_dismissed");
    
    // Trigger direct APK file download
    const link = document.createElement("a");
    link.href = apkDownloadUrl;
    link.download = "teekeh-scanner.apk";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actions = [
    {
      label: "Record Sale",
      icon: ShoppingCart,
      onClick: () => router.push("/sales"),
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
    {
      label: "Receive Stock",
      icon: PackagePlus,
      onClick: () => router.push("/inventory"),
      color: "bg-surface text-foreground border hover:bg-muted",
    },
    {
      label: "Add Product",
      icon: PlusCircle,
      onClick: () => router.push("/products"),
      color: "bg-surface text-foreground border hover:bg-muted",
    },
    {
      label: "Get Mobile App",
      icon: Smartphone,
      onClick: handleGetMobileApp,
      color: "bg-gold/15 text-gold border border-gold/30 hover:bg-gold/20",
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
            onClick={action.onClick}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
