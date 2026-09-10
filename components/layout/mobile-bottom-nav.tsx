"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useLanguage } from "@/components/providers/language-provider";
import { useSession } from "@/components/providers/session-provider";
import { SidebarIcon } from "./sidebar/sidebar-icon";

type Tab = {
  label: string;
  href: string;
  icon: string;
};

const MERCHANT_TABS: Tab[] = [
  { label: "Products", href: "/products", icon: "/sidebar/products.svg" },
  { label: "Orders", href: "/orders", icon: "/sidebar/orders.svg" },
  { label: "Dashboard", href: "/", icon: "/sidebar/dashboard.svg" },
  { label: "Customers", href: "/customers", icon: "/sidebar/customers.svg" },
  { label: "Account", href: "/settings/account", icon: "/sidebar/account.svg" },
];

const SUPERADMIN_TABS: Tab[] = [
  { label: "Tenants", href: "/superadmin/tenants", icon: "/sidebar/customers.svg" },
  { label: "Users", href: "/superadmin/users", icon: "/sidebar/user.svg" },
  { label: "Overview", href: "/superadmin", icon: "/sidebar/dashboard.svg" },
  { label: "Tickets", href: "/superadmin/tickets", icon: "/sidebar/help-desk.svg" },
  { label: "Account", href: "/settings/account", icon: "/sidebar/account.svg" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/" || href === "/superadmin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Merchant (and superadmin) tab bar — md:hidden. One primary pill glides
 * between tabs so the bar itself never remounts on navigation. */
export function MobileBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { me } = useSession();
  const tabs =
    me?.user.is_superadmin === true ? SUPERADMIN_TABS : MERCHANT_TABS;
  const activeIndex = tabs.findIndex((tab) => isActivePath(pathname, tab.href));

  return (
    <nav
      aria-label="Primary"
      className="relative z-40 -mx-3 mt-0 shrink-0 md:hidden"
    >
      <div
        className={[
          "relative rounded-t-2xl border-t border-black/10 bg-surface",
          "shadow-[0_-10px_28px_rgba(15,23,42,0.10)]",
          "dark:border-white/15 dark:shadow-[0_-12px_32px_rgba(0,0,0,0.45)]",
        ].join(" ")}
      >
        <div className="relative px-1.5 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
          <div className="relative grid grid-cols-5">
            <motion.div
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/5 px-0.5"
              initial={false}
              animate={{
                x: `${Math.max(activeIndex, 0) * 100}%`,
                opacity: activeIndex >= 0 ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="h-full rounded-md bg-primary" />
            </motion.div>

            {tabs.map((tab, i) => {
              const active = i === activeIndex;
              const className = [
                "relative z-10 flex min-w-0 flex-col items-center gap-0.5 py-2",
                "rounded-md transition-colors duration-200",
                active ? "text-white" : "text-muted",
              ].join(" ");

              const inner = (
                <>
                  <SidebarIcon src={tab.icon} className="size-[1.3rem]" />
                  <span className="max-w-full truncate px-0.5 text-[10px] font-medium leading-none">
                    {t(tab.label)}
                  </span>
                </>
              );

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={className}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
