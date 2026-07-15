"use server";

import { revalidatePath } from "next/cache";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/features/notifications/services/notification.service";
import { requirePermission } from "@/lib/auth/server-permissions";

export async function getNotificationsAction(limitVal?: number) {
  await requirePermission("products:read");
  return getNotifications(limitVal);
}

export async function markAsReadAction(id: string) {
  await requirePermission("products:read");
  await markAsRead(id);
  revalidatePath("/");
  return { success: true };
}

export async function markAllAsReadAction() {
  await requirePermission("products:read");
  await markAllAsRead();
  revalidatePath("/");
  return { success: true };
}
