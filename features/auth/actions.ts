"use server";

import { getUserProfile } from "@/lib/auth";

export async function getCurrentUserProfile() {
  return await getUserProfile();
}
