"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Warehouse, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { recordStockMovementAction } from "@/features/inventory/actions/record-stock-movement";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string;
  created_at: string;
  products: { name: string; sku: string } | null;
  users: { name: string } | null;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [movementType, setMovementType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, sku, quantity, low_stock_threshold")
      .eq("status", "active")
      .order("name");

    const { data: movementsData } = await supabase
      .from("stock_movements")
      .select(`
        *,
        products (name, sku),
        users (name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    setProducts(productsData || []);
    setMovements(movementsData as any || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    setIsSubmitting(true);

    try {
      const qty = parseInt(quantity);

      await recordStockMovementAction({
        product_id: selectedProduct,
        type: movementType as "stock_in" | "stock_out" | "adjustment" | "return",
        quantity: qty,
        notes,
      });

      toast.success("Stock updated successfully");
      setIsFormOpen(false);
      setSelectedProduct("");
      setQuantity("");
      setNotes("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const typeConfig: Record<string, { label: string; className: string }> = {
    stock_in: { label: "Stock In", className: "bg-success/10 text-success" },
    stock_out: { label: "Stock Out", className: "bg-error/10 text-error" },
    adjustment: { label: "Adjustment", className: "bg-info/10 text-info" },
    sale: { label: "Sale", className: "bg-gold/10 text-gold" },
    return: { label: "Return", className: "bg-warning/10 text-warning" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Inventory</h1>
          <p className="text-text-secondary">Manage stock levels and movements</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </div>

      {/* Current Stock */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Current Stock</h2>
        </div>
        <div className="px-4 py-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-border px-4 py-2 text-sm font-medium text-text-secondary">
          <span>Product</span>
          <span>SKU</span>
          <span>Quantity</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-text-secondary">No products found</div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="font-medium">{product.name}</span>
              <span className="text-sm text-text-secondary">{product.sku}</span>
              <span
                className={`font-medium ${
                  product.quantity === 0
                    ? "text-error"
                    : product.quantity <= product.low_stock_threshold
                    ? "text-warning"
                    : ""
                }`}
              >
                {product.quantity}
              </span>
              <Badge
                variant={
                  product.quantity === 0
                    ? "destructive"
                    : product.quantity <= product.low_stock_threshold
                    ? "outline"
                    : "default"
                }
              >
                {product.quantity === 0
                  ? "Out of Stock"
                  : product.quantity <= product.low_stock_threshold
                  ? "Low Stock"
                  : "In Stock"}
              </Badge>
            </div>
          ))
        )}
      </div>

      {/* Recent Movements */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent Movements</h2>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border px-4 py-2 text-sm font-medium text-text-secondary">
          <span>Date</span>
          <span>Product</span>
          <span>Type</span>
          <span>Qty</span>
          <span>User</span>
          <span>Notes</span>
        </div>
        {movements.length === 0 ? (
          <div className="py-8 text-center text-text-secondary">No movements yet</div>
        ) : (
          movements.map((movement) => {
            const config = typeConfig[movement.type] || typeConfig.adjustment;
            return (
              <div
                key={movement.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <span className="text-sm">
                  {new Date(movement.created_at).toLocaleDateString()}
                </span>
                <span className="text-sm">{movement.products?.name || "—"}</span>
                <Badge className={config.className}>{config.label}</Badge>
                <span className="text-sm font-medium">{movement.quantity}</span>
                <span className="text-sm text-text-secondary">
                  {movement.users?.name || "—"}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {movement.notes || "—"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Stock Movement Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Qty: {p.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v ?? "stock_in")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_in">Stock In</SelectItem>
                  <SelectItem value="stock_out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {movementType === "adjustment" ? "New Quantity" : "Quantity"}
              </Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
