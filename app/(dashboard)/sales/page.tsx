"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ShoppingCart, Search, Eye, Camera } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createSaleAction } from "@/features/sales/actions/create-sale";
import { validateCouponAction } from "@/features/coupons/actions/coupon-actions";
import { PermissionGate } from "@/components/shared/permission-gate";
import { BarcodeScanner } from "@/components/shared/barcode-scanner";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  selling_price: number;
  quantity: number;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total: number;
}

interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - parseFloat(discount || "0");

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, sku, barcode, selling_price, quantity")
      .eq("status", "active")
      .gt("quantity", 0)
      .order("name");

    const { data: salesData } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setProducts(productsData || []);
    setSales(salesData || []);
    setLoading(false);
  }, []);

  // Recalculate coupon discount when subtotal or applied coupon changes
  useEffect(() => {
    if (appliedCoupon) {
      let couponDiscount = 0;
      if (appliedCoupon.discount_type === "percentage") {
        couponDiscount = subtotal * (appliedCoupon.discount_value / 100);
        if (appliedCoupon.max_discount_amount && couponDiscount > appliedCoupon.max_discount_amount) {
          couponDiscount = appliedCoupon.max_discount_amount;
        }
      } else {
        couponDiscount = appliedCoupon.discount_value;
      }
      setDiscount(couponDiscount.toFixed(2));
    }
  }, [subtotal, appliedCoupon]);

  // Reset form states on close
  useEffect(() => {
    if (!isFormOpen) {
      setCustomerName("");
      setCustomerPhone("");
      setItems([]);
      setDiscount("0");
      setPaymentMethod("cash");
      setCouponCode("");
      setAppliedCoupon(null);
    }
  }, [isFormOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      const res = await validateCouponAction(couponCode, subtotal);
      if (!res.success || !res.coupon) {
        toast.error(res.error || "Invalid coupon code");
        return;
      }

      const coupon = res.coupon;
      let couponDiscount = 0;
      if (coupon.discount_type === "percentage") {
        couponDiscount = subtotal * (coupon.discount_value / 100);
        if (coupon.max_discount_amount && couponDiscount > coupon.max_discount_amount) {
          couponDiscount = coupon.max_discount_amount;
        }
      } else {
        couponDiscount = coupon.discount_value;
      }

      setAppliedCoupon(coupon);
      setDiscount(couponDiscount.toFixed(2));
      toast.success(`Coupon code "${coupon.code}" applied!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setDiscount("0");
    toast.success("Coupon removed");
  };

  // Scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<"product" | "coupon">("product");

  const openProductScanner = () => {
    setScannerType("product");
    setIsScannerOpen(true);
  };

  const openCouponScanner = () => {
    setScannerType("coupon");
    setIsScannerOpen(true);
  };

  const handleProductScan = (code: string) => {
    const trimmedCode = code.trim();
    const product = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmedCode.toLowerCase()) ||
        p.sku.toLowerCase() === trimmedCode.toLowerCase()
    );

    if (!product) {
      toast.error(`Product with SKU or Barcode "${code}" not found or out of stock`);
      return;
    }

    const existingItem = items.find((i) => i.product_id === product.id);
    const currentAddedQty = existingItem ? existingItem.quantity : 0;

    if (currentAddedQty + 1 > product.quantity) {
      toast.error(`Cannot add more "${product.name}". Only ${product.quantity} in stock.`);
      return;
    }

    const existingIndex = items.findIndex((i) => i.product_id === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total =
        newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: Number(product.selling_price),
          quantity: 1,
          total: Number(product.selling_price),
        },
      ]);
    }
    toast.success(`"${product.name}" added to cart!`);
  };

  const handleCouponScan = async (code: string) => {
    const trimmedCode = code.trim().toUpperCase();
    setCouponCode(trimmedCode);
    setIsApplyingCoupon(true);
    try {
      const res = await validateCouponAction(trimmedCode, subtotal);
      if (!res.success || !res.coupon) {
        toast.error(res.error || "Invalid coupon code");
        return;
      }

      const coupon = res.coupon;
      let couponDiscount = 0;
      if (coupon.discount_type === "percentage") {
        couponDiscount = subtotal * (coupon.discount_value / 100);
        if (coupon.max_discount_amount && couponDiscount > coupon.max_discount_amount) {
          couponDiscount = coupon.max_discount_amount;
        }
      } else {
        couponDiscount = coupon.discount_value;
      }

      setAppliedCoupon(coupon);
      setDiscount(couponDiscount.toFixed(2));
      toast.success(`Coupon code "${coupon.code}" applied!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(itemQuantity);
    const existingItem = items.find((i) => i.product_id === product.id);
    const currentAddedQty = existingItem ? existingItem.quantity : 0;

    if (qty <= 0 || (currentAddedQty + qty) > product.quantity) {
      toast.error(`Invalid quantity. Only ${product.quantity} items in stock, you have already added ${currentAddedQty}.`);
      return;
    }

    const existingIndex = items.findIndex((i) => i.product_id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      newItems[existingIndex].total =
        newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: Number(product.selling_price),
          quantity: qty,
          total: Number(product.selling_price) * qty,
        },
      ]);
    }

    setSelectedProduct("");
    setItemQuantity("1");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const parsedDiscount = parseFloat(discount || "0");
    if (isNaN(parsedDiscount) || parsedDiscount < 0) {
      toast.error("Discount must be a valid positive number");
      return;
    }

    if (total < 0) {
      toast.error("Total price cannot be negative. Please adjust the discount.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createSaleAction({
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal,
        discount: parseFloat(discount || "0"),
        total,
        payment_method: paymentMethod as "cash" | "card" | "transfer" | "mobile",
        coupon_id: appliedCoupon?.id || null,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
      });

      toast.success("Sale completed successfully");
      setIsFormOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to process sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Sales</h1>
          <p className="text-text-secondary">Record and manage sales</p>
        </div>
        <PermissionGate permission="sales:write">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </PermissionGate>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-medium">No sales yet</h3>
          <p className="mt-2 text-text-secondary">Record your first sale to get started.</p>
          <PermissionGate permission="sales:write">
            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </PermissionGate>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_80px] gap-4 border-b border-border px-4 py-3 text-sm font-medium text-text-secondary">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Total</span>
            <span>Payment</span>
            <span></span>
          </div>
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_80px] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
            >
              <span className="font-mono text-sm">{sale.invoice_number}</span>
              <span className="text-sm">{sale.customer_name || "Walk-in"}</span>
              <span className="text-sm text-text-secondary">
                {new Date(sale.created_at).toLocaleDateString()}
              </span>
              <span className="font-medium text-success">{formatCurrency(sale.total)}</span>
              <Badge variant="outline" className="w-fit capitalize">
                {sale.payment_method}
              </Badge>
              <Link href={`/sales/${sale.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* New Sale Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Add Item */}
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label className="flex justify-between items-center">
                  <span>Product</span>
                  <button
                    type="button"
                    onClick={openProductScanner}
                    className="text-xs text-gold hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Scan Barcode
                  </button>
                </Label>
                <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.selling_price)} ({p.quantity} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-2">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addItem}>
                  Add
                </Button>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="rounded-lg border border-border">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-4 py-2 text-sm font-medium text-text-secondary">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Qty</span>
                  <span>Total</span>
                  <span></span>
                </div>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-4 py-2 last:border-0"
                  >
                    <span className="text-sm">{item.product_name}</span>
                    <span className="text-sm">{formatCurrency(item.unit_price)}</span>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <span className="text-sm font-medium">{formatCurrency(item.total)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Coupon Code */}
            <div className="space-y-1.5 border-t border-border pt-4">
              <Label className="text-xs font-semibold flex justify-between items-center">
                <span>Apply Coupon</span>
                {!appliedCoupon && (
                  <button
                    type="button"
                    onClick={openCouponScanner}
                    disabled={items.length === 0}
                    className="text-[11px] text-gold hover:underline inline-flex items-center gap-1 font-semibold disabled:opacity-50"
                  >
                    <Camera className="h-3 w-3" />
                    Scan Coupon QR
                  </button>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. SUMMER50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon || items.length === 0}
                  className="flex-1 uppercase font-heading font-medium tracking-wide h-9 text-sm"
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="h-9"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isApplyingCoupon || items.length === 0}
                    className="h-9"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Discount</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  disabled={!!appliedCoupon}
                  className="w-24 text-right h-8 text-sm"
                />
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-success">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "cash")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || items.length === 0}>
                {isSubmitting ? "Processing..." : "Complete Sale"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <BarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanSuccess={scannerType === "product" ? handleProductScan : handleCouponScan}
        title={scannerType === "product" ? "Scan Product Barcode / SKU" : "Scan Coupon Barcode / QR"}
      />
    </div>
  );
}
