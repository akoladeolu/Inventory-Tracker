"use client";

import { useState } from "react";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandForm } from "./brand-form";
import { deleteBrandAction } from "@/features/brands/actions/brand-actions";
import { PermissionGate } from "@/components/shared/permission-gate";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface BrandsTableProps {
  brands: Brand[];
  onRefresh: () => void;
}

export function BrandsTable({ brands, onRefresh }: BrandsTableProps) {
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingBrand) return;

    setIsDeleting(true);

    try {
      await deleteBrandAction(deletingBrand.id);
      toast.success("Brand deleted successfully");
      setDeletingBrand(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete brand");
    } finally {
      setIsDeleting(false);
    }
  };

  if (brands.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary">
        No brands found. Create your first brand to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-[1.5fr_2fr_1fr_auto] gap-4 border-b border-border px-4 py-3 font-medium text-text-secondary">
          <span>Name</span>
          <span>Description</span>
          <span>Created</span>
          <span className="w-10"></span>
        </div>
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="grid grid-cols-[1.5fr_2fr_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
          >
            <span className="font-medium">{brand.name}</span>
            <span className="text-sm text-text-secondary line-clamp-1">{brand.description || "-"}</span>
            <span className="text-sm text-text-secondary">
              {new Date(brand.created_at).toLocaleDateString()}
            </span>
            <PermissionGate permission="categories:write">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingBrand(brand)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingBrand(brand)}
                    className="text-error"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGate>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingBrand && (
        <BrandForm
          open={!!editingBrand}
          onOpenChange={(open) => !open && setEditingBrand(null)}
          initialData={editingBrand}
          onSuccess={() => {
            setEditingBrand(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingBrand}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingBrand?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingBrand(null)}
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
