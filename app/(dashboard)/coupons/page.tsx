"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CouponForm } from "@/features/coupons/components/coupon-form";
import { CouponsTable } from "@/features/coupons/components/coupons-table";
import { createClient } from "@/lib/supabase/client";
import { PermissionGate } from "@/components/shared/permission-gate";

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

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchCoupons = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Coupons fetch error:", error.message);
    }

    setCoupons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Coupons & Discounts</h1>
          <p className="text-text-secondary">Manage promo codes and active discounts</p>
        </div>
        <PermissionGate permission="categories:write">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
        </PermissionGate>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <CouponsTable coupons={coupons} onRefresh={fetchCoupons} />
      )}

      <CouponForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchCoupons();
        }}
      />
    </div>
  );
}
