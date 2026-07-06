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
import { CategoryForm } from "./category-form";
import { deleteCategoryAction } from "@/features/categories/actions/category-actions";
import { PermissionGate } from "@/components/shared/permission-gate";

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface CategoriesTableProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoriesTable({ categories, onRefresh }: CategoriesTableProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);

    try {
      await deleteCategoryAction(deletingCategory.id);
      toast.success("Category deleted successfully");
      setDeletingCategory(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="py-12 text-center text-text-secondary">
        No categories found. Create your first category to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-4 py-3 font-medium text-text-secondary">
          <span>Name</span>
          <span>Created</span>
          <span className="w-10"></span>
        </div>
        {categories.map((category) => (
          <div
            key={category.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
          >
            <span className="font-medium">{category.name}</span>
            <span className="text-sm text-text-secondary">
              {new Date(category.created_at).toLocaleDateString()}
            </span>
            <PermissionGate permission="categories:write">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <PermissionGate permission="categories:delete">
                    <DropdownMenuItem
                      onClick={() => setDeletingCategory(category)}
                      className="text-error"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </PermissionGate>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGate>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <CategoryForm
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          initialData={editingCategory}
          onSuccess={() => {
            setEditingCategory(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
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
