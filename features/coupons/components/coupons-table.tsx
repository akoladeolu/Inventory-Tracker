"use client";

import { useState } from "react";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteCouponAction,
  toggleCouponActiveAction,
} from "@/features/coupons/actions/coupon-actions";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  min_purchase_amount: string;
  max_discount_amount: string | null;
  active: boolean;
  start_date: string;
  end_date: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
}

interface CouponsTableProps {
  coupons: Coupon[];
  onRefresh: () => void;
}

export function CouponsTable({ coupons, onRefresh }: CouponsTableProps) {
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingCoupon) return;

    setIsDeleting(true);

    try {
      await deleteCouponAction(deletingCoupon.id);
      toast.success("Coupon code deleted successfully");
      setDeletingCoupon(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const nextActive = !coupon.active;
      await toggleCouponActiveAction(coupon.id, nextActive);
      toast.success(`Coupon code ${coupon.code} is now ${nextActive ? "active" : "inactive"}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle status");
    }
  };

  if (coupons.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary">
        No coupon codes found. Create your first coupon to offer discounts.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-[1.5fr_1.5fr_1.2fr_1.2fr_1.2fr_1fr_auto] gap-4 border-b border-border px-4 py-3 font-medium text-text-secondary">
          <span>Code</span>
          <span>Discount</span>
          <span>Min Purchase</span>
          <span>Usage</span>
          <span>Expiry</span>
          <span>Status</span>
          <span className="w-10"></span>
        </div>
        {coupons.map((coupon) => {
          const discountVal = Number(coupon.discount_value);
          const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();
          const isLimitReached = coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit;
          const status = coupon.active && !isExpired && !isLimitReached ? "active" : "inactive";

          return (
            <div
              key={coupon.id}
              className="grid grid-cols-[1.5fr_1.5fr_1.2fr_1.2fr_1.2fr_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
            >
              <span className="font-heading font-semibold tracking-wide text-gold">{coupon.code}</span>
              <span className="text-sm">
                {coupon.discount_type === "percentage"
                  ? `${discountVal}%`
                  : formatCurrency(discountVal)}
                {coupon.max_discount_amount && (
                  <span className="block text-[11px] text-text-secondary">
                    Max: {formatCurrency(Number(coupon.max_discount_amount))}
                  </span>
                )}
              </span>
              <span className="text-sm">{formatCurrency(Number(coupon.min_purchase_amount))}</span>
              <span className="text-sm">
                {coupon.usage_count} / {coupon.usage_limit || "∞"}
              </span>
              <span className="text-sm text-text-secondary">
                {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : "Never"}
              </span>
              <div>
                <button
                  onClick={() => handleToggleActive(coupon)}
                  className="focus:outline-none"
                >
                  {status === "active" ? (
                    <Badge className="bg-success/10 text-success border border-success/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-error/10 text-error border border-error/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer">
                      <XCircle className="h-3 w-3" />
                      {isExpired ? "Expired" : isLimitReached ? "Max Limit" : "Inactive"}
                    </Badge>
                  )}
                </button>
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingCoupon(coupon)}
                  className="h-8 w-8 text-error hover:text-error-hover hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingCoupon}
        onOpenChange={(open) => !open && setDeletingCoupon(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete coupon &quot;{deletingCoupon?.code}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCoupon(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
