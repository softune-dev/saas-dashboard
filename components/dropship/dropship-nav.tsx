"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { dropshipNav } from "./dropship-nav-config";

/** Same shell/behavior as components/settings/site/site-settings-nav.tsx —
 * horizontally-scrolled tab bar on mobile, sticky sidebar on desktop, active
 * tab kept in view on route change. */
export function DropshipNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

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
        aria-label="Dropship sections"
        className="flex flex-row overflow-x-auto scrollbar-none gap-1 bg-surface p-1 rounded-lg sm:flex-col sm:gap-0.5 sm:p-2 sm:rounded-md"
      >
        <p className="hidden sm:block px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
          {t("Sections")}
        </p>
        {dropshipNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.LucideIcon;

          return (
            <Link
              key={item.id}
              href={item.href}
              ref={active ? activeRef : undefined}
              className={[
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 sm:py-2.5",
                active ? "bg-primary text-white" : "text-foreground hover:bg-search-bg",
              ].join(" ")}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
