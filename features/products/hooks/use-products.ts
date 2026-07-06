"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  brand: string;
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

interface ProductFilters {
  search?: string;
  category_id?: string;
  status?: string;
  page?: number;
}

export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("products")
      .select("*, categories(name)", { count: "exact" });

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
      );
    }

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const page = filters?.page || 1;
    const per_page = 20;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      setProducts(data || []);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / per_page));
    }

    setLoading(false);
  }, [filters?.search, filters?.category_id, filters?.status, filters?.page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, total, totalPages, loading, refetch: fetchProducts };
}
