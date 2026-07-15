import { db } from "@/lib/db";
import { activity_logs } from "@/lib/db/schema";
import { getUserProfile } from "@/lib/auth";

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: string
) {
  try {
    const profile = await getUserProfile();
    if (!profile) return;

    await db.insert(activity_logs).values({
      user_id: profile.id,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || "",
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
