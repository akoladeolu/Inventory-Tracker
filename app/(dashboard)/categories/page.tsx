"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/features/categories/components/category-form";
import { CategoriesTable } from "@/features/categories/components/categories-table";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories fetch error:", error.message);
    }

    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Categories</h1>
          <p className="text-text-secondary">
            Manage your product categories
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <CategoriesTable categories={categories} onRefresh={fetchCategories} />
      )}

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchCategories();
        }}
      />
    </div>
  );
}
