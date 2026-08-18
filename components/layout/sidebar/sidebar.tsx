"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { clearToken } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSession } from "@/components/providers/session-provider";
import { useNotificationsSWR } from "@/lib/api/notifications";
import { logoutItem, menuItems, settingsItems } from "./nav-config";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSection } from "./sidebar-section";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { currentSite } = useSession();
  const siteId = currentSite?.id ?? null;

  const { data: notifications = [] } = useNotificationsSWR(siteId);
  const unreadOrderCount = notifications.filter(
    (n) => n.type === "order_created" && !n.read_at
  ).length;

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="no-shadow flex w-[15.5rem] shrink-0 flex-col rounded-md bg-surface"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3">
          <SidebarSection title="Menu">
            {menuItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                badge={item.href === "/orders" ? unreadOrderCount : undefined}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Settings">
            {settingsItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </SidebarSection>
        </div>

        <div className="shrink-0 p-3">
          <SidebarNavItem
            item={logoutItem}
            variant="logout"
            onClick={() => setLogoutOpen(true)}
          />
        </div>
      </motion.aside>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        description="You'll need to sign in again to access the dashboard."
        confirmLabel="Log out"
        onConfirm={() => {
          clearToken();
          window.location.reload();
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </>
  );
}
