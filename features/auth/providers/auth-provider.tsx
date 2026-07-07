"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { getCurrentUserProfile } from "@/features/auth/actions";

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
  created_at: string | Date;
  updated_at: string | Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("[AuthProvider] Error fetching user:", error.message);
        }
        setUser(user);

        if (user) {
          const profileData = await getCurrentUserProfile();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("[AuthProvider] Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await getCurrentUserProfile();
          setProfile(profileData);
        } else {
          setProfile(null);
        }

        setLoading(false);

        if (event === "SIGNED_IN") {
          router.refresh();
        }
      }
    );


    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
