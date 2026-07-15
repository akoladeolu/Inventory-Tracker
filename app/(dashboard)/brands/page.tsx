"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandForm } from "@/features/brands/components/brand-form";
import { BrandsTable } from "@/features/brands/components/brands-table";
import { createClient } from "@/lib/supabase/client";
import { PermissionGate } from "@/components/shared/permission-gate";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchBrands = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Brands fetch error:", error.message);
    }

    setBrands(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Brands</h1>
          <p className="text-text-secondary">Manage your product brands</p>
        </div>
        <PermissionGate permission="categories:write">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </PermissionGate>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <BrandsTable brands={brands} onRefresh={fetchBrands} />
      )}

      <BrandForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchBrands();
        }}
      />
    </div>
  );
}
