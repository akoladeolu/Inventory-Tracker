"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function useLogout() {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("An unexpected error occurred");
    }
  }, [router]);

  return { logout };
}
