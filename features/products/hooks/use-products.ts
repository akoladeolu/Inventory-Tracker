"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/features/products/services/product.service";

interface ProductFilters {
  search?: string;
  category_id?: string;
  status?: string;
  page?: number;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useProducts(filters?: ProductFilters) {
  // Debounce the search term to prevent excessive API calls
  const debouncedSearch = useDebounce(filters?.search, 300);

  const queryFilters = {
    ...filters,
    search: debouncedSearch,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["products", queryFilters],
    queryFn: () => getProducts(queryFilters),
  });

  return {
    products: data?.products || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    refetch,
  };
}
