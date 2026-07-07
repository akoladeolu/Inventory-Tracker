"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { Plus, Search, Filter, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/features/products/hooks/use-products";
import { ProductForm } from "@/features/products/components/product-form";
import { createClient } from "@/lib/supabase/client";
import { PermissionGate } from "@/components/shared/permission-gate";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const { products, total, totalPages, loading, refetch } = useProducts({
    search,
    category_id: categoryFilter || undefined,
    status: statusFilter || undefined,
    page,
  });

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").order("name");
      setCategories(data || []);
    }
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Products</h1>
          <p className="text-text-secondary">Manage your product inventory</p>
        </div>
        <PermissionGate permission="products:write">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value === "all" || !value ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === "all" || !value ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-medium">No products found</h3>
          <p className="mt-2 text-text-secondary">Get started by adding your first product.</p>
          <PermissionGate permission="products:write">
            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </PermissionGate>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-surface">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 border-b border-border px-4 py-3 text-sm font-medium text-text-secondary">
              <span>Product</span>
              <span>Category</span>
              <span>Cost</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
            </div>
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-text-secondary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-text-secondary">{product.sku}</p>
                  </div>
                </div>
                <span className="text-sm">{product.categories?.name || "—"}</span>
                <span className="text-sm">{formatCurrency(product.cost_price)}</span>
                <span className="text-sm">{formatCurrency(product.selling_price)}</span>
                <span
                  className={`text-sm font-medium ${
                    product.quantity === 0
                      ? "text-error"
                      : product.quantity <= product.low_stock_threshold
                        ? "text-warning"
                        : ""
                  }`}
                >
                  {product.quantity}
                </span>
                {product.status === "active" ? (
                  <Badge className="bg-success/10 text-success border border-success/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-error/10 text-error border border-error/20 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    Archived
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} products
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categories={categories}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
