"use client";

import { useUser } from "@/features/auth/hooks/use-user";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";

export function TopBar() {
  const { profile } = useUser();
  const { logout } = useLogout();

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gold/10 text-gold text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-text-primary">
                {profile?.name || "User"}
              </p>
              <p className="text-xs text-text-secondary capitalize">
                {profile?.role || "Staff"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="font-medium">{profile?.name}</p>
                <p className="text-xs font-normal text-text-secondary">
                  {profile?.email}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
