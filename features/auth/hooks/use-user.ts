"use client";

import { useAuth } from "@/features/auth/providers/auth-provider";

export function useUser() {
  const { user, profile, loading, refreshProfile } = useAuth();
  return { user, profile, loading, refreshProfile };
}
