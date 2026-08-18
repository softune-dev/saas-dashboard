"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaskIcon } from "@/components/ui/mask-icon";
import { siteSettingsNav } from "./site-nav-config";

export function SiteSettingsNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 sm:sticky sm:top-3 sm:w-56 sm:self-start">
      <nav
        aria-label="Site settings sections"
        className="flex flex-col gap-0.5 rounded-md bg-white p-2"
      >
        <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
          Sections
        </p>
        {siteSettingsNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Lucide = item.LucideIcon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={[
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
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
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
