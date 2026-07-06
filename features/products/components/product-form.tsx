"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productSchema, type ProductInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import {
  createProductAction,
  updateProductAction,
} from "@/features/products/actions/product-actions";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  categories: Category[];
  onSuccess: () => void;
}

export function ProductForm({
  open,
  onOpenChange,
  initialData,
  categories,
  onSuccess,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      category_id: initialData?.category_id || "",
      brand: initialData?.brand || "",
      cost_price: initialData?.cost_price || 0,
      selling_price: initialData?.selling_price || 0,
      quantity: initialData?.quantity || 0,
      low_stock_threshold: initialData?.low_stock_threshold || 10,
      description: initialData?.description || "",
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    const supabase = createClient();
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage.from("products").upload(fileName, file);

    if (error) {
      toast.error("Failed to upload image");
      return;
    }

    const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path);

    setValue("image_url", urlData.publicUrl);
  };

  const onSubmit = async (data: ProductInput) => {
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateProductAction(initialData.id, data);
        toast.success("Product updated successfully");
      } else {
        await createProductAction(data);
        toast.success("Product created successfully");
      }

      reset();
      setImagePreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the product details below." : "Fill in the product details below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setValue("image_url", "");
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-error p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-gold">
                  <Upload className="h-6 w-6 text-text-secondary" />
                  <span className="mt-1 text-xs text-text-secondary">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Leather Watch"
                {...register("name")}
                className={errors.name ? "border-error" : ""}
              />
              {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                placeholder="e.g., WRK-001"
                {...register("sku")}
                className={errors.sku ? "border-error" : ""}
              />
              {errors.sku && <p className="text-sm text-error">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                defaultValue={initialData?.category_id}
                onValueChange={(value) => setValue("category_id", value)}
              >
                <SelectTrigger className={errors.category_id ? "border-error" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-error">{errors.category_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" placeholder="e.g., TEEKEH" {...register("brand")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                {...register("cost_price", { valueAsNumber: true })}
                className={errors.cost_price ? "border-error" : ""}
              />
              {errors.cost_price && (
                <p className="text-sm text-error">{errors.cost_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                {...register("selling_price", { valueAsNumber: true })}
                className={errors.selling_price ? "border-error" : ""}
              />
              {errors.selling_price && (
                <p className="text-sm text-error">{errors.selling_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                className={errors.quantity ? "border-error" : ""}
              />
              {errors.quantity && <p className="text-sm text-error">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                {...register("low_stock_threshold", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update"
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
