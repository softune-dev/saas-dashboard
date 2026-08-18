"use client";

import Link from "next/link";
import type { NavItem } from "./nav-config";
import { SidebarIcon } from "./sidebar-icon";

type SidebarNavItemProps = {
  item: NavItem;
  active?: boolean;
  /** Light primary fill, primary text/icon, full width. onClick opens confirm. */
  variant?: "default" | "logout";
  onClick?: () => void;
  badge?: number;
};

export function SidebarNavItem({
  item,
  active = false,
  variant = "default",
  onClick,
  badge,
}: SidebarNavItemProps) {
  const isLogout = variant === "logout";

  const className = isLogout
    ? "flex w-full items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
    : [
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "text-foreground hover:bg-search-bg",
      ].join(" ");

  if (isLogout) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <SidebarIcon src={item.icon} className="size-5" />
        <span className="truncate min-w-0">{item.label}</span>
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      <SidebarIcon src={item.icon} className="size-5" />
      <span className="truncate min-w-0">{item.label}</span>
      {badge && badge > 0 ? (
        <span className="relative ml-auto flex shrink-0 items-center justify-center">
          <span
            className={[
              "absolute inline-flex size-full animate-ping rounded-full opacity-75",
              active ? "bg-white" : "bg-primary",
            ].join(" ")}
          />
          <span
            className={[
              "relative inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ring-2",
              active
                ? "bg-white text-primary ring-primary"
                : "bg-primary text-white ring-white",
            ].join(" ")}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        </span>
      ) : item.tag ? (
        <span
          className={[
            "ml-auto inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-normal leading-none transition-colors",
            active
              ? "bg-white text-primary"
              : "bg-primary text-white",
          ].join(" ")}
        >
          {item.tag}
        </span>
      ) : null}
    </Link>
  );
}
