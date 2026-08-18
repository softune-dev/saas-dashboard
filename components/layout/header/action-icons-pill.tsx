"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { MaskIcon } from "@/components/ui/mask-icon";
import { AiSidebar } from "@/components/ai-chat/ai-sidebar";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import { playNotificationSound } from "@/lib/notification-sound";
import { enablePushForSite, pushPermission } from "@/lib/push";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotificationsSWR,
  type NotificationOut,
  type NotificationType,
} from "@/lib/api/notifications";

type ActionIconButtonProps = {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
};

function ActionIconButton({ label, onClick, children }: ActionIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex size-9 items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-search-bg cursor-pointer"
    >
      {children}
    </button>
  );
}

const NOTIF_ICONS: Record<NotificationType, string> = {
  order_created: "/sidebar/orders.svg",
  order_blocked: "/sidebar/lock.svg",
  site_published: "/sidebar/themes.svg",
  site_unpublished: "/sidebar/themes.svg",
};

export function ActionIconsPill() {
  const router = useRouter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;

  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Lazy initializer, not an effect: this only reads a synchronous browser
  // API (no subscription to set up), so there's nothing an effect would add
  // besides an extra render.
  const [pushState, setPushState] = useState<ReturnType<typeof pushPermission>>(
    () => (typeof window === "undefined" ? "default" : pushPermission()),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], mutate: mutateNotifications } =
    useNotificationsSWR(siteId);

  // If notification permission is already "granted" (e.g. the merchant
  // toggled it directly in the browser's own site settings instead of
  // clicking our button below), there's no actual push subscription yet —
  // the button that would normally create one only shows for "default"
  // permission, so without this it'd be permanently stuck: granted, but
  // silently never subscribed. Safe to do without a click here: only the
  // permission PROMPT itself needs a user gesture, not subscribe() once
  // permission is already granted. enablePushForSite is idempotent (checks
  // for an existing subscription first), so this is safe to run every time
  // the site loads.
  useEffect(() => {
    if (!siteId || pushPermission() !== "granted") return;
    enablePushForSite(siteId).catch(() => {});
  }, [siteId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // On a genuinely NEW notification between polls (not on first load — that
  // would fire for every unread item already sitting there from before this
  // tab opened, and not on every re-render): order events get a chime +
  // toast (successful order also live-refreshes the Orders page if it's
  // mounted). Site publish/unpublish only update the bell silently.
  const lastSeenId = useRef<string | null>(null);
  const hasSeenFirstLoad = useRef(false);
  useEffect(() => {
    if (notifications.length === 0) return;
    const newest = notifications[0];
    if (!hasSeenFirstLoad.current) {
      hasSeenFirstLoad.current = true;
      lastSeenId.current = newest.id;
      return;
    }
    if (newest.id === lastSeenId.current) return;
    lastSeenId.current = newest.id;

    if (newest.type === "order_created") {
      playNotificationSound();
      toast({
        title: newest.title,
        description: newest.body,
        variant: "success",
        action: newest.link
          ? { label: "View order", onClick: () => router.push(newest.link!) }
          : undefined,
      });
      // Orders page uses key [siteId, "orders", ...] — revalidate every
      // variant of it (any status filter/page) so it updates without the
      // user having to refresh, per the same "no manual refresh" ask.
      mutateGlobal((key) => Array.isArray(key) && key[1] === "orders");
    } else if (newest.type === "order_blocked") {
      playNotificationSound();
      toast({
        title: newest.title,
        description: newest.body,
        variant: "info",
        action: newest.link
          ? { label: "Review blocklist", onClick: () => router.push(newest.link!) }
          : undefined,
      });
    }
  }, [notifications, toast, router, mutateGlobal]);

  async function handleEnablePush() {
    if (!siteId) return;
    const ok = await enablePushForSite(siteId);
    setPushState(pushPermission());
    toast(
      ok
        ? { title: "Push notifications enabled", variant: "success" }
        : {
            title: "Couldn't enable push notifications",
            description: "Check your browser's notification permission for this site.",
            variant: "info",
          },
    );
  }

  async function handleNotificationClick(notif: NotificationOut) {
    if (!siteId) return;
    setNotifOpen(false);
    if (!notif.read_at) {
      await mutateNotifications(
        (prev = []) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n,
          ),
        false,
      );
      markNotificationRead(siteId, notif.id).catch(() => {});
    }
    if (notif.link) router.push(notif.link);
  }

  async function handleMarkAllRead() {
    if (!siteId || unreadCount === 0) return;
    const now = new Date().toISOString();
    await mutateNotifications(
      (prev = []) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })),
      false,
    );
    markAllNotificationsRead(siteId).catch(() => {});
  }

  return (
    <>
      <div className="relative z-40" ref={dropdownRef}>
        <div className="relative z-50 flex shrink-0 items-center gap-1 rounded-full bg-border p-1 transition-colors hover:opacity-90">
          <ActionIconButton label="Notifications" onClick={() => setNotifOpen(!notifOpen)}>
            <MaskIcon
              src="/sidebar/notification.svg"
              className="size-[18px]"
            />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </span>
            )}
          </ActionIconButton>
          <ActionIconButton
            label="AI Assistant"
            onClick={() => setAiSidebarOpen(true)}
          >
            <img
              src="/sidebar/gemini.svg"
              alt="AI Assistant"
              className="size-[18px]"
            />
          </ActionIconButton>
        </div>

        {/* Backdrop Overlay when dropdown is open */}
        {notifOpen && (
          <div 
            className="fixed inset-0 bg-black/10 z-40" 
            onClick={() => setNotifOpen(false)}
          />
        )}

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl origin-top-right"
            >
              <div className="flex items-center justify-between border-b border-border/60 bg-search-bg/30 px-4 py-3">
                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                <button
                  type="button"
                  disabled={unreadCount === 0}
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  Mark all as read
                </button>
              </div>
              {pushState === "default" ? (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  className="flex w-full items-center gap-2 border-b border-border/60 bg-primary/5 px-4 py-2.5 text-left text-[11px] font-medium text-primary hover:bg-primary/10"
                >
                  <MaskIcon src="/sidebar/notification.svg" className="size-3.5" />
                  Enable push notifications for new orders
                </button>
              ) : pushState === "denied" ? (
                <div className="border-b border-border/60 bg-search-bg/30 px-4 py-2.5 text-[11px] text-muted-soft">
                  Push notifications are blocked for this site in your browser.
                </div>
              ) : null}
              <div className="max-h-[320px] overflow-y-auto scrollbar-none flex flex-col">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-muted">No notifications yet.</p>
                    <p className="mt-1 text-xs text-muted-soft">
                      New orders and site updates will show up here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      type="button"
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors last:border-0 hover:bg-search-bg/50 ${!notif.read_at ? "bg-primary/5" : ""}`}
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-search-bg text-muted">
                        <MaskIcon src={NOTIF_ICONS[notif.type]} className="size-4" />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] ${!notif.read_at ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-muted-soft shrink-0">
                            {formatRelativeTime(new Date(notif.created_at))}
                          </span>
                        </div>
                        {notif.body ? (
                          <span className="text-xs text-muted leading-relaxed line-clamp-2">
                            {notif.body}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Chatbot Sidebar Drawer */}
      <AiSidebar
        open={aiSidebarOpen}
        onClose={() => setAiSidebarOpen(false)}
      />
    </>
  );
}
