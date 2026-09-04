"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthGate } from "@/components/auth/auth-gate";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { LanguageProvider } from "@/components/providers/language-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { localStorageProvider } from "@/lib/swr-persist";

/** Client-side app providers (toast, auth gate, session, etc.)
 *
 * ThemeProvider wraps everything so next-themes can set `.dark` on <html>
 * before AuthGate/Session paint. SessionProvider sits INSIDE AuthGate on
 * purpose: it calls /auth/me and /sites on mount, both of which require a
 * valid token, so it must only ever mount once AuthGate has already
 * confirmed one exists.
 *
 * SWRConfig wraps everything: navigating between Categories/Products/Orders/
 * etc. previously re-fetched from Postgres on every visit, which is what
 * made page navigation feel slow — each one paid a full network round-trip
 * to Supabase before rendering. SWR caches by key, so a page you've already
 * loaded this session renders instantly from cache and refreshes quietly in
 * the background instead of blocking on a spinner. revalidateOnFocus is off
 * because an admin dashboard doesn't need to refetch every time the browser
 * tab regains focus — only real events (this tab's own mutations, or a
 * manual reload) should trigger a refetch. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SWRConfig
          value={{
            provider: localStorageProvider,
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 4000,
            keepPreviousData: true,
          }}
        >
          <ToastProvider>
            <AuthGate>
              <SessionProvider>
                <OnboardingGuard>{children}</OnboardingGuard>
              </SessionProvider>
            </AuthGate>
          </ToastProvider>
        </SWRConfig>
      </LanguageProvider>
    </ThemeProvider>
  );
}
