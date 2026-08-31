"use client";

import { Menu } from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "@/components/providers/session-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ActionIconsPill } from "./action-icons-pill";
import { CreditsPill } from "./credits-pill";
import { LogoPill } from "./logo-pill";
import { SearchBar } from "./search-bar";
import { StorePill } from "./store-pill";
import { SuperadminAccountPill } from "./superadmin-account-pill";
import { SuperadminSearchBar } from "./superadmin-search-bar";

type HeaderProps = {
  /** Opens the mobile nav drawer (< md). */
  onOpenMobileNav?: () => void;
};

/**
 * Single header tree for all breakpoints — md: toggles visibility so
 * shared controls mount once (no duplicate AI/notification state).
 */
export function Header({ onOpenMobileNav }: HeaderProps) {
  const { me } = useSession();
  const isSuperadmin = me?.user.is_superadmin === true;

  return (
    <motion.header
      data-tour="header"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="no-shadow relative z-40 flex h-[3.75rem] min-w-0 shrink-0 items-center rounded-md bg-surface px-3"
    >
      {onOpenMobileNav ? (
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenMobileNav}
          className="mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-search-bg md:hidden"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
      ) : null}

      <LogoPill />
      <div className="hidden md:contents">
        <ThemeToggle className="ml-5" />
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 md:gap-2 lg:gap-3">
        {isSuperadmin ? (
          <>
            <div className="hidden md:block">
              <SuperadminSearchBar />
            </div>
            <SuperadminAccountPill />
          </>
        ) : (
          <>
            <div className="hidden md:block">
              <SearchBar />
            </div>
            <div className="hidden md:block">
              <CreditsPill />
            </div>
            <ActionIconsPill />
            <StorePill />
          </>
        )}
      </div>
    </motion.header>
  );
}
