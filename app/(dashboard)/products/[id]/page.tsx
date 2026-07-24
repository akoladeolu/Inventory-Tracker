"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Archive, Trash2, Package, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  archiveProductAction,
  deleteProductAction,
} from "@/features/products/actions/product-actions";
import { PermissionGate } from "@/components/shared/permission-gate";
import { LabelGenerator } from "@/features/products/components/LabelGenerator";
import { ProductForm } from "@/features/products/components/product-form";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  brand_id?: string | null;
  barcode?: string | null;
  brands?: { name: string } | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  description: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string;
  created_at: string;
  users: { name: string } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  const fetchProduct = useCallback(async () => {
    const supabase = createClient();

    const { data: productData } = await supabase
      .from("products")
      .select("*, categories(name), brands(name)")
      .eq("id", params.id)
      .single();

    const { data: movementsData } = await supabase
      .from("stock_movements")
      .select(
        `
        *,
        users (name)
      `
      )
      .eq("product_id", params.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setProduct(productData);
    setMovements((movementsData as any) || []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProduct();

    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories(data || []);
    }
    async function fetchBrands() {
      const supabase = createClient();
      const { data } = await supabase.from("brands").select("*").order("name");
      setBrands(data || []);
    }
    fetchCategories();
    fetchBrands();
  }, [fetchProduct]);

  const handleArchive = async () => {
    if (!product) return;

    setIsArchiving(true);

    try {
      await archiveProductAction(product.id);
      toast.success("Product archived");
      fetchProduct();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive product");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProductAction(product.id);
      toast.success("Product deleted");
      router.push("/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">Product not found</p>
        <Button className="mt-4" onClick={() => router.push("/products")}>
          Back to Products
        </Button>
      </div>
    );
  }

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
        <Button variant="ghost" onClick={() => router.push("/products")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <div className="flex gap-2">
          {product.status === "active" && (
            <>
              <PermissionGate permission="products:write">
                <Button variant="outline" onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate permission="products:write">
                <Button
                  variant="outline"
                  onClick={() => setIsLabelModalOpen(true)}
                  className="gap-2 border-[#C8A348] text-[#C8A348] hover:bg-[#C8A348]/10"
                >
                  <Printer className="h-4 w-4" />
                  Print Label
                </Button>
              </PermissionGate>
              <PermissionGate permission="products:write">
                <Button variant="outline" onClick={handleArchive} disabled={isArchiving}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </PermissionGate>
            </>
          )}
          <PermissionGate permission="products:delete">
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start gap-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-12 w-12 text-text-secondary" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-charcoal">{product.name}</h1>
                    <p className="text-text-secondary">SKU: {product.sku}</p>
                    {product.barcode && (
                      <p className="text-xs text-text-secondary mt-1">Barcode: {product.barcode}</p>
                    )}
                  </div>
                  {product.status === "active" ? (
                    <Badge className="bg-success/10 text-success border border-success/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-error/10 text-error border border-error/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
                      Archived
                    </Badge>
                  )}
                </div>
                {product.brands?.name && (
                  <p className="mt-2 text-sm text-text-secondary">Brand: {product.brands.name}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-text-secondary">Category</p>
                  <p className="font-medium">{product.categories?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cost Price</p>
                  <p className="font-medium">{formatCurrency(product.cost_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Selling Price</p>
                  <p className="font-medium">{formatCurrency(product.selling_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Margin</p>
                  <p className="font-medium text-success">
                    {Number(product.cost_price) > 0 ? (
                      (
                        ((Number(product.selling_price) - Number(product.cost_price)) /
                          Number(product.cost_price)) *
                        100
                      ).toFixed(1) + "%"
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-text-secondary">Description</p>
                <p className="mt-1">{product.description || "No description"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p
                  className={`text-5xl font-bold ${
                    product.quantity === 0
                      ? "text-error"
                      : product.quantity <= product.low_stock_threshold
                        ? "text-warning"
                        : "text-success"
                  }`}
                >
                  {product.quantity}
                </p>
                <p className="mt-2 text-text-secondary">Threshold: {product.low_stock_threshold}</p>
                <Badge
                  className={`mt-4 ${
                    product.quantity === 0
                      ? "bg-error/10 text-error"
                      : product.quantity <= product.low_stock_threshold
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                  }`}
                >
                  {product.quantity === 0
                    ? "Out of Stock"
                    : product.quantity <= product.low_stock_threshold
                      ? "Low Stock"
                      : "In Stock"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="py-4 text-center text-text-secondary">No movements yet</p>
              ) : (
                <div className="space-y-3">
                  {movements.slice(0, 5).map((movement) => {
                    const config = typeConfig[movement.type] || typeConfig.adjustment;
                    return (
                      <div key={movement.id} className="flex items-center justify-between text-sm">
                        <div>
                          <Badge className={config.className}>{config.label}</Badge>
                          <span className="ml-2">{movement.quantity}</span>
                        </div>
                        <span className="text-text-secondary">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={product}
        categories={categories}
        brands={brands}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchProduct();
        }}
      />
      <LabelGenerator
        open={isLabelModalOpen}
        onOpenChange={setIsLabelModalOpen}
        products={[{
          ...product,
          brand_name: product.brands?.name || '',
          category_name: product.categories?.name || ''
        }]}
      />
    </div>
  );
}
