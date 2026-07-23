"use client";

import { useUser } from "./use-user";
import { hasPermission, hasAnyPermission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

export function usePermissions() {
  const { profile, loading } = useUser();
  const role = profile?.role as UserRole | undefined;

  const checkPermission = (permission: string): boolean => {
    // During loading or uninitialized state, allow navigation items to render
    if (!role) return true;
    return hasPermission(role, permission);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    if (!role) return true;
    return hasAnyPermission(role, permissions);
  };

  return {
    role,
    checkPermission,
    checkAnyPermission,
    isOwner: role === "owner",
    isManager: role === "manager",
    isStaff: role === "staff",
  };
}
