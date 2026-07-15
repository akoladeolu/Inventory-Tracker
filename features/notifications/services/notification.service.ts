import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getNotifications(limitVal = 20) {
  return db
    .select()
    .from(notifications)
    .orderBy(sql`${notifications.created_at} DESC`)
    .limit(limitVal);
}

export async function createNotification(type: string, title: string, message: string) {
  const [notif] = await db
    .insert(notifications)
    .values({ type, title, message })
    .returning();
  return notif;
}

export async function markAsRead(id: string) {
  await db
    .update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.id, id));
}

export async function markAllAsRead() {
  await db.update(notifications).set({ is_read: true });
}
