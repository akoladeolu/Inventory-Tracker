"use client";

import { useUser } from "./use-user";
import { hasPermission, hasAnyPermission } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

export function usePermissions() {
  const { profile } = useUser();
  const role = profile?.role as UserRole | undefined;

  const checkPermission = (permission: string): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    if (!role) return false;
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
