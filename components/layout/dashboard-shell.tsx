"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header/header";
import { Sidebar } from "./sidebar/sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

/**
 * Dashboard chrome: floating white header + sidebar over #EAEAEA.
 * Theme editor routes hide the main sidebar (editor has its own toolbar).
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isThemeEditor = pathname.startsWith("/themes/editor");

  return (
    <div className="flex h-dvh max-w-[100vw] flex-col gap-3 overflow-x-hidden bg-background p-3">
      <Header />
      <div className="flex min-h-0 min-w-0 flex-1 gap-3">
        {!isThemeEditor ? <Sidebar /> : null}
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
  );
}
