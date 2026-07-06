"use client";

import { useAuth } from "@/features/auth/providers/auth-provider";

export function useUser() {
  const { user, profile, loading } = useAuth();
  return { user, profile, loading };
}
