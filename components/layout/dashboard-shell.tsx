"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TourProvider } from "@/components/tour";
import { Header } from "./header/header";
import { MobileSidebar } from "./sidebar/mobile-sidebar";
import { Sidebar } from "./sidebar/sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

/**
 * Dashboard chrome: floating white header + sidebar over #EAEAEA.
 * Theme editor routes hide the main sidebar (editor has its own toolbar).
 * Below md the docked sidebar becomes a hamburger drawer.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isThemeEditor = pathname.startsWith("/themes/editor");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <TourProvider>
      <div className="flex h-dvh max-w-[100vw] flex-col gap-3 overflow-x-hidden bg-background p-3">
        <Header
          onOpenMobileNav={
            isThemeEditor ? undefined : () => setMobileNavOpen(true)
          }
        />
        <div className="flex min-h-0 min-w-0 flex-1 gap-3">
          {!isThemeEditor ? (
            <>
              <Sidebar />
              <MobileSidebar
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
              />
            </>
          ) : null}
          <main
            className={[
              "min-w-0 flex-1",
              isThemeEditor ? "overflow-hidden" : "overflow-auto",
            ].join(" ")}
          >
            {children}
          </main>
        </div>
      </div>
    </TourProvider>
  );
}
