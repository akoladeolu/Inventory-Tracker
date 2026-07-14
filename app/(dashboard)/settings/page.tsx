"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/features/auth/hooks/use-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUsersAction,
  createUserAction,
  updateUserRoleAction,
  deleteUserAction,
} from "@/features/auth/actions";

export default function SettingsPage() {
  const { profile, refreshProfile } = useUser();
  const { logout } = useLogout();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Change Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // User Management state (Owner Only)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add User Dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"owner" | "manager" | "staff">("staff");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Delete User Dialog state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  const fetchUsers = useCallback(async () => {
    if (profile?.role !== "owner") return;
    setLoadingUsers(true);
    try {
      const data = await getUsersAction();
      setUsersList(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      await refreshProfile?.();
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
      setIsChangePasswordOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsCreatingUser(true);
    try {
      const res = await createUserAction({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to create user");
        return;
      }
      toast.success("User created successfully");
      setIsAddUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, role: "owner" | "manager" | "staff") => {
    try {
      const res = await updateUserRoleAction(userId, role);
      if (!res.success) {
        toast.error(res.error || "Failed to update role");
        return;
      }
      toast.success("Role updated successfully");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserAction(userToDelete.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete user");
        return;
      }
      toast.success("User deleted successfully");
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
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
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management (Owner Only) */}
        {profile?.role === "owner" && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-text-secondary mt-1">
                  Manage staff accounts and assign roles.
                </p>
              </div>
              <Button onClick={() => setIsAddUserOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
              ) : usersList.length === 0 ? (
                <p className="py-6 text-center text-text-secondary">No other users found</p>
              ) : (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 border-b border-border bg-muted/50 px-4 py-3 text-sm font-medium text-text-secondary">
                      <span>Name</span>
                      <span>Email</span>
                      <span>Role</span>
                      <span>Joined</span>
                      <span></span>
                    </div>
                    <div className="divide-y divide-border">
                      {usersList.map((u) => (
                        <div
                          key={u.id}
                          className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] items-center gap-4 px-4 py-3 text-sm"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="text-text-secondary">{u.email}</span>
                          <div>
                            {u.id === profile?.id ? (
                              <span className="capitalize font-medium text-gold bg-gold/10 px-2.5 py-1 rounded-full text-xs">
                                {u.role} (You)
                              </span>
                            ) : (
                              <Select
                                value={u.role}
                                onValueChange={(val: any) => handleRoleChange(u.id, val)}
                              >
                                <SelectTrigger className="h-8 w-28 text-xs capitalize">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <span className="text-text-secondary">
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                          <div>
                            {u.id !== profile?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setUserToDelete(u)}
                                className="h-8 w-8 text-error hover:text-error-hover hover:bg-error/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account */}
        <Card>
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

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Update your password to keep your account secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dialog-new-password">New Password</Label>
              <Input
                id="dialog-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dialog-confirm-password">Confirm New Password</Label>
              <Input
                id="dialog-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsChangePasswordOpen(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new account for your staff and assign their role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Full Name</Label>
              <Input
                id="new-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newUserRole}
                onValueChange={(val: any) => setNewUserRole(val)}
              >
                <SelectTrigger className="capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-error">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}&apos;s account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
