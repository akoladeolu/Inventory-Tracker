"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
