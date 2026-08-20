"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { clearToken } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSession } from "@/components/providers/session-provider";
import { useOnboardingSidebarProgress } from "@/components/onboarding/use-onboarding-sidebar-progress";
import { useTour } from "@/components/tour";
import { useNotificationsSWR } from "@/lib/api/notifications";
import { useAutoHideScrollbar } from "@/lib/hooks/use-auto-hide-scrollbar";
import {
  logoutItem,
  menuItems,
  settingsItems,
  setupItem,
  tourIdForHref,
  tourItem,
} from "./nav-config";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSection } from "./sidebar-section";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavContentProps = {
  /** Called after a nav link is chosen (closes the mobile drawer). */
  onNavigate?: () => void;
  /** Mobile-only extras above Tour/Logout (search, credits, theme). */
  footerExtras?: React.ReactNode;
  /** Mobile-only block above the scrollable sections (e.g. search). */
  headerExtras?: React.ReactNode;
};

/** Shared nav sections + footer actions — used by desktop aside and mobile drawer. */
export function SidebarNavContent({
  onNavigate,
  footerExtras,
  headerExtras,
}: SidebarNavContentProps) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navScroll = useAutoHideScrollbar();
  const { currentSite } = useSession();
  const siteId = currentSite?.id ?? null;
  const { startTour } = useTour();

  const { data: notifications = [] } = useNotificationsSWR(siteId);
  const unreadOrderCount = notifications.filter(
    (n) => n.type === "order_created" && !n.read_at,
  ).length;
  const { badgeLabel: setupBadge } = useOnboardingSidebarProgress();
  const showSetup = currentSite ? currentSite.status !== "published" : true;

  return (
    <>
      {headerExtras}

      <div
        onScroll={navScroll.onScroll}
        className={[
          "scrollbar-auto-hide flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3",
          navScroll.className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showSetup ? (
          <div data-tour="nav-setup">
            <SidebarSection title="Getting Started">
              <SidebarNavItem
                item={setupItem}
                active={isActivePath(pathname, setupItem.href)}
                badgeLabel={setupBadge}
                tourId={tourIdForHref(setupItem.href)}
                onNavigate={onNavigate}
              />
            </SidebarSection>
          </div>
        ) : null}

        <SidebarSection title="Menu">
          {menuItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              badge={item.href === "/orders" ? unreadOrderCount : undefined}
              tourId={tourIdForHref(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Settings">
          {settingsItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              tourId={tourIdForHref(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 p-3">
        {footerExtras}
        <div className="hidden md:block">
          <SidebarNavItem
            item={tourItem}
            onClick={() => {
              onNavigate?.();
              startTour();
            }}
          />
        </div>
        <SidebarNavItem
          item={logoutItem}
          variant="logout"
          onClick={() => setLogoutOpen(true)}
        />
      </div>

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
