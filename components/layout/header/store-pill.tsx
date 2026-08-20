"use client";

import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { getThemeById } from "@/components/themes/themes-data";
import { clearToken, listTemplates, resolveSiteLogoUrl } from "@/lib/api";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  logoutItem,
  menuItems,
  settingsItems,
  type NavItem,
} from "@/components/layout/sidebar/nav-config";

/** Quick jumps in the user menu — same icons/hrefs as the sidebar. */
const QUICK_LINKS: NavItem[] = [
  menuItems.find((i) => i.href === "/products")!,
  menuItems.find((i) => i.href === "/orders")!,
  menuItems.find((i) => i.href === "/customers")!,
  menuItems.find((i) => i.href === "/themes")!,
  settingsItems.find((i) => i.href === "/settings/site")!,
  settingsItems.find((i) => i.href === "/settings/account")!,
  settingsItems.find((i) => i.href === "/settings/billing")!,
].filter(Boolean);

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StorePill() {
  const pathname = usePathname();
  const { me, sites, currentSite, setCurrentSiteId, loading } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close when the route changes (link click inside menu).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const title = loading
    ? "Loading…"
    : (currentSite?.name ?? me?.tenant.name ?? "No site yet");
  const subtitle = loading
    ? ""
    : (me?.user.full_name ?? me?.user.email ?? "");
  const logoUrl = resolveSiteLogoUrl(currentSite);

  // Same shop URL rules as the My Shop panel — published domain when live,
  // otherwise the template preview with ?__site= for drafts.
  const { data: templates } = useSWR("templates", listTemplates);
  const templateKey = templates?.find(
    (t) => t.id === currentSite?.template_id,
  )?.key;
  const theme = templateKey ? getThemeById(templateKey) : undefined;
  const host = currentSite?.custom_domain || currentSite?.subdomain;
  const siteBaseDomain =
    process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softune.xyz";
  const realShopUrl =
    currentSite?.status === "published" && host
      ? `https://${host.includes(".") ? host : `${host}.${siteBaseDomain}`}`
      : null;
  const shopUrl =
    realShopUrl ??
    (theme?.previewUrl && host ? `${theme.previewUrl}?__site=${host}` : null);

  const displayName = me?.user.full_name?.trim() || "";
  const email = me?.user.email?.trim() || "";

  function handleLogout() {
    clearToken();
    setOpen(false);
    window.location.href = "/";
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[11.5rem] shrink-0 items-center gap-2 rounded-full bg-border py-1.5 pr-1.5 pl-1.5 transition-opacity hover:opacity-90 md:max-w-[13rem] md:gap-2.5 md:pr-3"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu: ${title}${subtitle ? ` — ${subtitle}` : ""}`}
      >
        {logoUrl ? (
          // Logos are rarely 1:1 — contain + inset keeps the full mark inside
          // the circle instead of cropping with object-cover.
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
            <Image
              src={logoUrl}
              alt=""
              fill
              className="object-contain p-1.5"
              sizes="36px"
              unoptimized
            />
          </span>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-store text-white">
            <MaskIcon src="/sidebar/shop-bag.svg" className="size-4" />
          </span>
        )}

        {/* Name/email hidden below md so the mobile header stays avatar-only. */}
        <span className="hidden min-w-0 flex-col items-start text-left leading-tight md:flex">
          <span className="w-full max-w-[6.5rem] truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          {subtitle ? (
            <span className="w-full max-w-[6.5rem] truncate text-[11px] font-medium text-muted">
              {subtitle}
            </span>
          ) : null}
        </span>

        <ChevronDown
          className={[
            "hidden size-4 shrink-0 text-muted transition-transform md:block",
            open ? "rotate-180" : "",
          ].join(" ")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          // right-0 keeps the panel inside the viewport — left-0 was growing
          // past the page edge and expanding horizontal scroll.
          className="absolute top-full right-0 z-50 mt-2 w-[min(17.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface"
        >
          {/* Account header — email once; site host + open-shop arrow under it */}
          <div className="border-b border-border dark:border-transparent px-3.5 py-3">
            {displayName ? (
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
            ) : null}
            {email ? (
              <p
                className={[
                  "truncate",
                  displayName
                    ? "mt-0.5 text-xs text-muted"
                    : "text-sm font-semibold text-foreground",
                ].join(" ")}
              >
                {email}
              </p>
            ) : !displayName ? (
              <p className="truncate text-sm font-semibold text-foreground">
                Account
              </p>
            ) : null}
            {currentSite ? (
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <MaskIcon
                  src="/sidebar/domain.svg"
                  className="size-4 shrink-0 text-muted"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {host ?? "No domain yet"}
                </p>
                {shopUrl ? (
                  <a
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open shop in a new tab"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-primary"
                  >
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Site switcher */}
          {sites.length > 1 ? (
            <div className="border-b border-border dark:border-transparent p-1.5">
              <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
                Switch site
              </p>
              <div className="max-h-36 overflow-y-auto">
                {sites.map((site) => {
                  const active = site.id === currentSite?.id;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCurrentSiteId(site.id);
                        setOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-search-bg font-medium text-foreground"
                          : "text-foreground hover:bg-search-bg",
                      ].join(" ")}
                    >
                      <span className="min-w-0 flex-1 truncate">{site.name}</span>
                      {active ? (
                        <Check
                          className="size-3.5 shrink-0 text-primary"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quick links — sidebar icons */}
          <div className="p-1.5">
            <p className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-muted-soft uppercase">
              Quick access
            </p>
            {QUICK_LINKS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={[
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-search-bg",
                  ].join(" ")}
                >
                  <MaskIcon src={item.icon} className="size-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-border dark:border-transparent p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <MaskIcon src={logoutItem.icon} className="size-4" />
              <span>{logoutItem.label}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
