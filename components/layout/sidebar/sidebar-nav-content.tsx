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
  menuCategories,
  settingsItems,
  setupItem,
  superadminItems,
  tourIdForHref,
  tourItem,
} from "./nav-config";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarSection } from "./sidebar-section";

function isActivePath(pathname: string, href: string) {
  // Exact match for roots so /superadmin/tenants doesn't light up Overview.
  if (href === "/" || href === "/superadmin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** True if the active route lives anywhere in this category — including a
 * grandchild route nested under an expandable item like Dropship — so the
 * category never renders collapsed with its active page hidden inside it. */
function categoryHasActiveRoute(pathname: string, items: import("./nav-config").NavItem[]): boolean {
  return items.some(
    (item) =>
      isActivePath(pathname, item.href) ||
      (item.children?.some((child) => isActivePath(pathname, child.href)) ?? false),
  );
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
  const { currentSite, me } = useSession();
  const siteId = currentSite?.id ?? null;
  const { startTour } = useTour();
  const isSuperadmin = me?.user.is_superadmin === true;

  const { data: notifications = [] } = useNotificationsSWR(
    isSuperadmin ? null : siteId,
  );
  const unreadOrderCount = notifications.filter(
    (n) => n.type === "order_created" && !n.read_at,
  ).length;
  const { badgeLabel: setupBadge } = useOnboardingSidebarProgress();
  // onboarding_completed_at, not `status`: trial signup (app/api/trial.py)
  // auto-publishes the site immediately so a new merchant sees a live store
  // right away, before ever opening the wizard — `status` alone can't tell
  // "still unpublished" apart from "trial site, wizard never finished".
  // completed_at is set exactly once, by StepFinish's own publish action
  // (see sites.onboarding_completed_at's own comment), so this stays hidden
  // for good afterward — logout, new device, doesn't matter, it's on the row.
  const showSetup = currentSite ? !currentSite.onboarding_completed_at : true;

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
        {isSuperadmin ? (
          <SidebarSection id="superadmin" title="Super Admin">
            {superadminItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                tourId={tourIdForHref(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarSection>
        ) : (
          <>
            {showSetup ? (
              <div data-tour="nav-setup">
                <SidebarSection id="getting-started" title="Getting Started">
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

            {menuCategories.map((category) => (
              <SidebarSection
                key={category.id}
                id={category.id}
                title={category.label}
                forceOpen={categoryHasActiveRoute(pathname, category.items)}
              >
                {category.items.map((item) => (
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
            ))}

            <SidebarSection
              id="settings"
              title="Settings"
              forceOpen={categoryHasActiveRoute(pathname, settingsItems)}
            >
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
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 p-3">
        {isSuperadmin ? null : footerExtras}
        {isSuperadmin ? null : (
          <div className="hidden md:block">
            <SidebarNavItem
              item={tourItem}
              onClick={() => {
                onNavigate?.();
                startTour();
              }}
            />
          </div>
        )}
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
