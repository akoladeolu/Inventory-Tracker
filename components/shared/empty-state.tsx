"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center glassmorphism rounded-xl border border-dashed"
    >
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-sm hover:shadow-md transition-shadow">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
