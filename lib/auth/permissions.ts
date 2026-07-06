import type { UserRole } from "@/types";

const permissions: Record<UserRole, string[]> = {
  owner: [
    "products:read",
    "products:write",
    "products:delete",
    "categories:read",
    "categories:write",
    "categories:delete",
    "inventory:read",
    "inventory:write",
    "stock_movements:read",
    "stock_movements:write",
    "sales:read",
    "sales:write",
    "suppliers:read",
    "suppliers:write",
    "reports:read",
    "users:read",
    "users:write",
    "settings:read",
    "settings:write",
  ],
  manager: [
    "products:read",
    "products:write",
    "categories:read",
    "categories:write",
    "inventory:read",
    "inventory:write",
    "stock_movements:read",
    "stock_movements:write",
    "sales:read",
    "sales:write",
    "suppliers:read",
    "suppliers:write",
    "reports:read",
  ],
  staff: [
    "products:read",
    "inventory:read",
    "stock_movements:read",
    "sales:read",
    "sales:write",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, perms: string[]): boolean {
  return perms.some((perm) => hasPermission(role, perm));
}
