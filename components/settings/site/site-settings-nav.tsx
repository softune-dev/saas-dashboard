"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useLanguage } from "@/components/providers/language-provider";
import { siteSettingsNav } from "./site-nav-config";

export function SiteSettingsNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const { t } = useLanguage();

  // The mobile bar is a horizontally-scrolled <nav> and each tab is a real
  // route change, so the browser has no memory of scroll position across
  // navigations — the bar snaps back to its start and the active tab (e.g.
  // "SEO", scrolled off to the right) is invisible until the merchant
  // manually swipes again. Scroll it back into view on every route change,
  // same as the page itself already scrolling to top on navigate.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname]);

  return (
    <aside className="w-full shrink-0 sm:sticky sm:top-3 sm:w-56 sm:self-start">
      <nav
        aria-label="Site settings sections"
        className="flex flex-row overflow-x-auto scrollbar-none gap-1 bg-surface p-1 rounded-lg sm:flex-col sm:gap-0.5 sm:p-2 sm:rounded-md"
      >
        <p className="hidden sm:block px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
          {t("Sections")}
        </p>
        {siteSettingsNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Lucide = item.LucideIcon;

          return (
            <Link
              key={item.id}
              href={item.href}
              ref={active ? activeRef : undefined}
              className={[
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 sm:py-2.5",
                active
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-search-bg",
              ].join(" ")}
            >
              {Lucide ? (
                <Lucide className="size-4 shrink-0" strokeWidth={1.75} />
              ) : item.iconSrc ? (
                <MaskIcon src={item.iconSrc} className="size-4" />
              ) : null}
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
