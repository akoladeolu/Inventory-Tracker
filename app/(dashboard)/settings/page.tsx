"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/features/auth/hooks/use-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { profile } = useUser();
  const { logout } = useLogout();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) {
      toast.error("You must be logged in to change password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
        <p className="text-text-secondary">Manage your account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profile?.role || ""}
                disabled
                className="bg-muted capitalize"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Update your password to keep your account secure.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Sign out of your account. You will need to sign in again to access the application.
            </p>
            <Separator />
            <Button variant="destructive" onClick={logout}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
