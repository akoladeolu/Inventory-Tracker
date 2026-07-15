"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Loader2, CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from "@/features/notifications/actions/notification-actions";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: any;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotificationsAction(10);
      setNotifications(data || []);
    } catch (err: any) {
      console.error("Failed to load notifications:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing dropdown
    try {
      await markAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-lg p-2 text-gray-400 hover:bg-soft-black hover:text-white focus:outline-none transition-colors">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] max-h-[400px] overflow-y-auto bg-charcoal border-soft-black p-0 text-white">
        <div className="flex items-center justify-between border-b border-soft-black px-4 py-2.5">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllAsRead}
              disabled={loading}
              className="text-xs text-gold hover:text-gold hover:bg-soft-black h-7"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark all read"}
            </Button>
          )}
        </div>
        <div className="divide-y divide-soft-black">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">
              No recent notifications
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={(e) => !n.is_read && handleMarkAsRead(n.id, e)}
                className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer focus:bg-soft-black transition-colors ${
                  !n.is_read ? "bg-gold/5" : ""
                }`}
              >
                <CircleAlert className={`h-4 w-4 mt-0.5 flex-shrink-0 ${n.type === "low_stock" ? "text-warning" : "text-gold"}`} />
                <div className="flex-1 space-y-0.5">
                  <p className={`text-xs font-medium ${!n.is_read ? "text-white" : "text-gray-300"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[9px] text-gray-600">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="h-2 w-2 rounded-full bg-gold flex-shrink-0 mt-2" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
