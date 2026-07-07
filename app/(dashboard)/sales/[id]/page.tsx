"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Receipt, User, CreditCard, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  total: number;
  products: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Sale {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  created_at: string;
  users: { name: string } | null;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSale = useCallback(async () => {
    try {
      const supabase = createClient();

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select(`
          *,
          users (name)
        `)
        .eq("id", params.id)
        .single();

      if (saleError || !saleData) {
        setSale(null);
        setLoading(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from("sale_items")
        .select(`
          *,
          products (id, name, sku)
        `)
        .eq("sale_id", params.id);

      setSale(saleData as any);
      setItems((itemsData as any) || []);
    } catch {
      setSale(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">Sale not found</p>
        <Button className="mt-4" onClick={() => router.push("/sales")}>
          Back to Sales
        </Button>
      </div>
    );
  }

  const paymentMethodColors: Record<string, string> = {
    cash: "bg-success/10 text-success",
    card: "bg-info/10 text-info",
    transfer: "bg-gold/10 text-gold",
    mobile: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/sales")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sales
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sale Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {sale.invoice_number}
                </CardTitle>
                <Badge className={paymentMethodColors[sale.payment_method] || ""}>
                  {sale.payment_method}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-text-secondary">Customer</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {sale.customer_name || "Walk-in"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Phone</p>
                  <p className="font-medium">{sale.customer_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Sold By</p>
                  <p className="font-medium">{(sale.users as any)?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(sale.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-sm font-medium text-text-secondary">
                  <span>Product</span>
                  <span>Price</span>
                  <span>Qty</span>
                  <span>Total</span>
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{(item.products as any)?.name}</p>
                      <p className="text-xs text-text-secondary">
                        {(item.products as any)?.sku}
                      </p>
                    </div>
                    <span className="text-sm">{formatCurrency(item.unit_price)}</span>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Discount</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-success">{formatCurrency(sale.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
