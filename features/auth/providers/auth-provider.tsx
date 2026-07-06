"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
  created_at: string;
  updated_at: string;
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
          const { data, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", user.id)
            .single();
          if (profileError) {
            console.error("[AuthProvider] Error fetching profile:", profileError.message);
          }
          setProfile(data);
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
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", session.user.id)
            .single();
          if (error) {
            console.error("[AuthProvider] Error fetching profile on auth change:", error.message);
          }
          setProfile(data);
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
