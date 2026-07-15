"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { couponSchema, type CouponInput } from "@/lib/validations";
import { createCouponAction } from "@/features/coupons/actions/coupon-actions";

interface CouponFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CouponForm({ open, onOpenChange, onSuccess }: CouponFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponInput>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: "",
      discount_type: "percentage",
      discount_value: "" as any,
      min_purchase_amount: 0 as any,
      max_discount_amount: "" as any,
      usage_limit: "" as any,
      end_date: "",
    },
  });

  const discountType = watch("discount_type");

  const onSubmit = async (data: CouponInput) => {
    setIsLoading(true);

    try {
      // Cleanup empty values
      const payload = {
        ...data,
        code: data.code.toUpperCase(),
        discount_value: Number(data.discount_value),
        min_purchase_amount: Number(data.min_purchase_amount || 0),
        max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
        end_date: data.end_date || null,
      };

      await createCouponAction(payload as any);
      toast.success("Coupon created successfully");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Coupon</DialogTitle>
          <DialogDescription>
            Create a new discount code for your store.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              placeholder="e.g., SUMMER50, WELCOME2026"
              {...register("code")}
              onChange={(e) => setValue("code", e.target.value.toUpperCase())}
              className={errors.code ? "border-error" : ""}
            />
            {errors.code && (
              <p className="text-sm text-error">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <Select
                defaultValue="percentage"
                onValueChange={(value: any) => setValue("discount_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">Discount Value *</Label>
              <Input
                id="discount_value"
                type="number"
                step="any"
                placeholder={discountType === "percentage" ? "e.g., 10" : "e.g., 1000"}
                {...register("discount_value", { valueAsNumber: true })}
                className={errors.discount_value ? "border-error" : ""}
              />
              {errors.discount_value && (
                <p className="text-sm text-error">{errors.discount_value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_purchase_amount">Min Purchase Amount (₦)</Label>
              <Input
                id="min_purchase_amount"
                type="number"
                step="any"
                placeholder="e.g., 5000"
                {...register("min_purchase_amount", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_discount_amount">Max Discount (₦)</Label>
              <Input
                id="max_discount_amount"
                type="number"
                step="any"
                placeholder="No limit"
                disabled={discountType !== "percentage"}
                {...register("max_discount_amount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usage_limit">Usage Limit (Times)</Label>
              <Input
                id="usage_limit"
                type="number"
                placeholder="Unlimited"
                {...register("usage_limit", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Expiry Date</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
