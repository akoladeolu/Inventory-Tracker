"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { brandSchema, type BrandInput } from "@/lib/validations";
import {
  createBrandAction,
  updateBrandAction,
} from "@/features/brands/actions/brand-actions";

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string; name: string; description: string | null };
  onSuccess: () => void;
}

export function BrandForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: BrandFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const onSubmit = async (data: BrandInput) => {
    setIsLoading(true);

    try {
      if (isEditing) {
        await updateBrandAction(initialData.id, data);
        toast.success("Brand updated successfully");
      } else {
        await createBrandAction(data);
        toast.success("Brand created successfully");
      }

      reset();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the brand details below."
              : "Enter details for the new brand."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              placeholder="e.g., Rolex"
              {...register("name")}
              className={errors.name ? "border-error" : ""}
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Luxury watch brand"
              {...register("description")}
              className={errors.description ? "border-error" : ""}
            />
            {errors.description && (
              <p className="text-sm text-error">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
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
