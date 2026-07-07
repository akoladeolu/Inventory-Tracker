"use server";

import { getUserProfile } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/server-permissions";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export async function getCurrentUserProfile() {
  return await getUserProfile();
}

// Fetch all users
export async function getUsersAction() {
  await requirePermission("users:read");
  return await db.select().from(users).orderBy(users.created_at);
}

// Validation Schema inside features action
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "manager", "staff"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUserAction(input: CreateUserInput) {
  await requirePermission("users:write");
  const data = createUserSchema.parse(input);

  // Initialize standalone supabase client for creating user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // Sign up user via supabase auth (using standalone client to avoid current Owner session collision)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error("Failed to create auth user");
  }

  // Create database profile
  const [newProfile] = await db
    .insert(users)
    .values({
      auth_id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role,
    })
    .returning();

  return newProfile;
}

export async function updateUserRoleAction(id: string, role: "owner" | "manager" | "staff") {
  const currentProfile = await requirePermission("users:write");

  // Ensure current user is not changing their own role (avoid lockouts)
  if (currentProfile.id === id) {
    throw new Error("You cannot change your own role");
  }

  const [updatedProfile] = await db
    .update(users)
    .set({
      role,
      updated_at: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (!updatedProfile) {
    throw new Error("User not found");
  }

  return updatedProfile;
}

export async function deleteUserAction(id: string) {
  const currentProfile = await requirePermission("users:write");

  // Prevent self-deletion
  if (currentProfile.id === id) {
    throw new Error("You cannot delete your own account");
  }

  // Delete user from db table
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (!deletedUser) {
    throw new Error("User not found");
  }

  return deletedUser;
}
