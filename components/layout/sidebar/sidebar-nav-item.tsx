"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { NavItem } from "./nav-config";
import { SidebarIcon } from "./sidebar-icon";

function isActivePath(pathname: string, href: string) {
  if (href === "/" || href === "/superadmin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavItemProps = {
  item: NavItem;
  active?: boolean;
  /** Light primary fill, primary text/icon, full width. onClick opens confirm. */
  variant?: "default" | "logout";
  onClick?: () => void;
  /** Numeric ping badge (e.g. unread orders) — overrides item.badge when set. */
  badge?: number;
  /** Quiet text pill (e.g. Getting Started "4/9" or "Done"). */
  badgeLabel?: string;
  /** Product-tour spotlight target id (data-tour). */
  tourId?: string;
  /** Fires when a route link is activated (mobile drawer auto-close). */
  onNavigate?: () => void;
};

function NavPill({ active, badge, badgeLabel, tag }: {
  active: boolean;
  badge?: number;
  badgeLabel?: string;
  tag?: string;
}) {
  const isDoneLabel = badgeLabel === "Done";

  if (badgeLabel) {
    return (
      <span
        className={[
          "ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-semibold leading-none tabular-nums transition-colors",
          active
            ? "bg-surface text-primary"
            : isDoneLabel
              ? "bg-primary/10 text-primary"
              : "bg-primary text-white",
        ].join(" ")}
      >
        {isDoneLabel ? <Check className="size-3" strokeWidth={2.5} aria-hidden /> : null}
        {badgeLabel}
      </span>
    );
  }

  if (badge && badge > 0) {
    return (
      <span className="relative ml-auto flex shrink-0 items-center justify-center">
        <span
          className={[
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            active ? "bg-surface" : "bg-primary",
          ].join(" ")}
        />
        <span
          className={[
            "relative inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ring-2",
            active ? "bg-surface text-primary ring-primary" : "bg-primary text-white ring-white",
          ].join(" ")}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      </span>
    );
  }

  if (tag) {
    return (
      <span
        className={[
          "ml-auto inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-normal leading-none transition-colors",
          active ? "bg-surface text-primary" : "bg-primary text-white",
        ].join(" ")}
      >
        {tag}
      </span>
    );
  }

  return null;
}

import { useLanguage } from "@/components/providers/language-provider";

export function SidebarNavItem({
  item,
  active = false,
  variant = "default",
  onClick,
  badge,
  badgeLabel,
  tourId,
  onNavigate,
}: SidebarNavItemProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isLogout = variant === "logout";

  const hasChildren = !!item.children && item.children.length > 0;
  const childActive = hasChildren && item.children!.some((c) => isActivePath(pathname, c.href));
  const [expanded, setExpanded] = useState(childActive);

  // A direct link/refresh into a child route must always reveal it, even if
  // the group was previously collapsed — never leave the active page hidden.
  useEffect(() => {
    if (childActive) setExpanded(true);
  }, [childActive]);

  const groupActive = active || childActive;

  const className = isLogout
    ? "flex w-full items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
    : [
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        groupActive && !hasChildren
          ? "bg-primary text-white"
          : groupActive
            ? "bg-primary/8 text-primary"
            : "text-foreground hover:bg-search-bg",
      ].join(" ");

  if (hasChildren) {
    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={className}
          data-tour={tourId}
        >
          <SidebarIcon src={item.icon} className="size-5" />
          <span className="min-w-0 truncate">{t(item.label)}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {!expanded ? (
              <NavPill active={groupActive} badge={badge ?? item.badge} tag={item.tag} />
            ) : null}
            <ChevronDown
              className={[
                "size-4 shrink-0 transition-transform",
                expanded ? "" : "-rotate-90",
              ].join(" ")}
              strokeWidth={2}
            />
          </span>
        </button>

        {expanded ? (
          <div className="flex flex-col gap-0.5 border-l border-border/70 pl-3.5 ml-4">
            {item.children!.map((child) => {
              const childIsActive = isActivePath(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={childIsActive ? "page" : undefined}
                  data-tour={tourId ? `${tourId}-${child.href.split("/").pop()}` : undefined}
                  onClick={() => onNavigate?.()}
                  className={[
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    childIsActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-search-bg",
                  ].join(" ")}
                >
                  <SidebarIcon src={child.icon} className="size-4" />
                  <span className="min-w-0 truncate">{t(child.label)}</span>
                  <NavPill active={childIsActive} badge={child.badge} tag={child.tag} />
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (isLogout || onClick) {
    return (
      <button type="button" onClick={onClick} className={className} data-tour={tourId}>
        <SidebarIcon src={item.icon} className="size-5" />
        <span className="min-w-0 truncate">{t(item.label)}</span>
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
      data-tour={tourId}
      onClick={() => onNavigate?.()}
    >
      <SidebarIcon src={item.icon} className="size-5" />
      <span className="min-w-0 truncate">{t(item.label)}</span>
      <NavPill active={active} badge={badge ?? item.badge} badgeLabel={badgeLabel} tag={item.tag} />
    </Link>
  );
}
