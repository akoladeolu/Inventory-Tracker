"use client";

import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SlideOutPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SlideOutPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
}: SlideOutPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] glassmorphism border-l border-border/50 shadow-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl font-heading text-charcoal">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-text-secondary">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
