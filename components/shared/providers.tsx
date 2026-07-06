"use client";

import { AuthProvider } from "@/features/auth/providers/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
