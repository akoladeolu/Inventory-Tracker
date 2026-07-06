"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Truck, MoreHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { supplierSchema, type SupplierInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import {
  createSupplierAction,
  deleteSupplierAction,
  updateSupplierAction,
} from "@/features/suppliers/actions/supplier-actions";
import { PermissionGate } from "@/components/shared/permission-gate";

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema) as any,
  });

  const fetchSuppliers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });
    setSuppliers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openCreateForm = () => {
    setEditingSupplier(null);
    reset({ name: "", contact_person: "", email: "", phone: "", address: "" });
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setValue("name", supplier.name);
    setValue("contact_person", supplier.contact_person);
    setValue("email", supplier.email);
    setValue("phone", supplier.phone);
    setValue("address", supplier.address);
    setIsFormOpen(true);
  };

  const onSubmit = async (data: SupplierInput) => {
    setIsSubmitting(true);

    try {
      if (editingSupplier) {
        await updateSupplierAction(editingSupplier.id, data);
        toast.success("Supplier updated successfully");
      } else {
        await createSupplierAction(data);
        toast.success("Supplier created successfully");
      }

      setIsFormOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    try {
      await deleteSupplierAction(deletingSupplier.id);
      toast.success("Supplier deleted successfully");
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Suppliers</h1>
          <p className="text-text-secondary">Manage your suppliers</p>
        </div>
        <PermissionGate permission="suppliers:write">
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </PermissionGate>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-medium">No suppliers found</h3>
          <p className="mt-2 text-text-secondary">Add your first supplier to get started.</p>
          <PermissionGate permission="suppliers:write">
            <Button className="mt-4" onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </PermissionGate>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] gap-4 border-b border-border px-4 py-3 text-sm font-medium text-text-secondary">
            <span>Name</span>
            <span>Contact</span>
            <span>Email</span>
            <span>Phone</span>
            <span></span>
          </div>
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_80px] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
            >
              <span className="font-medium">{supplier.name}</span>
              <span className="text-sm">{supplier.contact_person || "—"}</span>
              <span className="text-sm">{supplier.email || "—"}</span>
              <span className="text-sm">{supplier.phone || "—"}</span>
              <PermissionGate permission="suppliers:write">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditForm(supplier)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingSupplier(supplier)}
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Update the supplier details below."
                : "Fill in the supplier details below."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Fashion Imports Ltd"
                {...register("name")}
                className={errors.name ? "border-error" : ""}
              />
              {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input id="contact_person" placeholder="John Doe" {...register("contact_person")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="supplier@example.com"
                  {...register("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1 234 567 890" {...register("phone")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Full address..." {...register("address")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingSupplier ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingSupplier?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSupplier(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
