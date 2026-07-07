import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.auth_id, user.id));

  return profile || null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const profile = await getUserProfile();
  if (!profile || !roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}
