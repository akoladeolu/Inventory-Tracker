import { getUserProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";

export async function requirePermission(permission: string) {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error("Not authenticated");
  }

  if (!hasPermission(profile.role, permission)) {
    throw new Error("You do not have permission to perform this action");
  }

  return profile;
}
