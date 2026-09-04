"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SoftuneLogo } from "@/components/brand/softune-logo";
import { CreditsPill } from "@/components/layout/header/credits-pill";
import { SearchBar } from "@/components/layout/header/search-bar";
import { SuperadminSearchBar } from "@/components/layout/header/superadmin-search-bar";
import { useSession } from "@/components/providers/session-provider";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNavContent } from "./sidebar-nav-content";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

/** Slide-in nav drawer for < md — same items as the desktop sidebar. */
export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { me } = useSession();
  const isSuperadmin = me?.user.is_superadmin === true;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[160] md:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,15.5rem)] flex-col bg-surface shadow-xl"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3 dark:border-transparent">
              <div className="min-w-0 flex-1">
                <SoftuneLogo className="h-7 w-auto" />
              </div>
              <ThemeToggle size="lg" className="ml-0 shrink-0" />
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <SidebarNavContent
              onNavigate={onClose}
              headerExtras={
                <div className="shrink-0 space-y-3 border-b border-border px-3 py-3 dark:border-transparent">
                  {isSuperadmin ? (
                    <SuperadminSearchBar className="w-full" />
                  ) : (
                    <SearchBar className="w-full" />
                  )}
                </div>
              }
              footerExtras={
                <div className="mb-1 flex w-full items-center justify-between gap-2">
                  <CreditsPill layout="inline" hideIcon hideLabel className="min-w-0 flex-1" />
                  <LanguageToggle short />
                </div>
              }
            />
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
