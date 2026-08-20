"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CreditsPill } from "@/components/layout/header/credits-pill";
import { SearchBar } from "@/components/layout/header/search-bar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNavContent } from "./sidebar-nav-content";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

/** Slide-in nav drawer for < md — same items as the desktop sidebar. */
export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
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
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border dark:border-transparent px-3 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <img
                    src="/logo.svg"
                    alt=""
                    className="h-[18px] w-auto object-contain brightness-0 invert"
                  />
                </span>
                <span className="truncate text-sm font-semibold text-foreground">
                  Softune
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>

            <SidebarNavContent
              onNavigate={onClose}
              headerExtras={
                <div className="shrink-0 space-y-3 border-b border-border dark:border-transparent px-3 py-3">
                  <SearchBar className="w-full" />
                </div>
              }
              footerExtras={
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CreditsPill />
                  </div>
                  <ThemeToggle className="ml-0 shrink-0 scale-90" />
                </div>
              }
            />
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
