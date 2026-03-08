// Notification Bell component
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type AppNotification,
} from "@/lib/notifications";

interface Props {
  onSelectItem?: (id: number, type: "movie" | "series") => void;
}

const NotificationBell = ({ onSelectItem }: Props) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      setNotifications(getAllNotifications());
      setUnread(getUnreadCount());
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
      setNotifications((n) =>
        n.map((x) => (x.id === notif.id ? { ...x, read: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    }
    if (notif.tmdbId && notif.mediaType && onSelectItem) {
      onSelectItem(notif.tmdbId, notif.mediaType);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-secondary/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto z-50 glass-panel-strong border border-border/50 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-3 border-b border-border/30">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 20).map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-0 ${
                  !notif.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{notif.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
