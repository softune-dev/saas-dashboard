"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMe, listSites, type MeOut, type SiteOut } from "@/lib/api";

const CURRENT_SITE_KEY = "softune.currentSiteId";
// SessionProvider fetches getMe()+listSites() on every mount — unlike the
// SWR-backed pages, this one is hand-rolled and previously had no
// persistence at all, so every hard refresh started every single page from
// a blank "loading" state even though this exact data was just fetched
// seconds ago. Caching it the same way (last-known-good shown instantly,
// refetched quietly in the background) removes that wait on reload too.
const SESSION_CACHE_KEY = "softune.session.cache";

type SessionCache = { me: MeOut; sites: SiteOut[] };

function readSessionCache(): SessionCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as SessionCache) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(me: MeOut, sites: SiteOut[]) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ me, sites }));
  } catch {
    // Not fatal — just means the next reload fetches fresh instead of cached.
  }
}

type SessionState = {
  me: MeOut | null;
  sites: SiteOut[];
  /** The site every commerce page (Categories/Products/Orders/...) reads
   * and writes against. Defaults to the tenant's first site; persisted so a
   * refresh doesn't silently jump to a different one once there's more than
   * one. Null only while loading, or if the tenant has no sites yet. */
  currentSite: SiteOut | null;
  setCurrentSiteId: (id: string) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

/** Fetches "who am I" + "what sites do I own" once, right after AuthGate
 * confirms a valid token — every commerce/dashboard page reads from this
 * instead of each re-implementing its own site resolution (the theme editor
 * used to be the only place doing anything like this, via a template-key
 * lookup; this generalizes it for the rest of the dashboard). */
export function SessionProvider({ children }: { children: ReactNode }) {
  // Computed once on mount and never again — re-reading/parsing localStorage
  // on every render would be wasted work once real state takes over.
  const [cached] = useState(() => readSessionCache());
  const [me, setMe] = useState<MeOut | null>(cached?.me ?? null);
  const [sites, setSites] = useState<SiteOut[]>(cached?.sites ?? []);
  const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(CURRENT_SITE_KEY);
    const fromCache = cached?.sites ?? [];
    return (fromCache.find((s) => s.id === stored) ?? fromCache[0])?.id ?? null;
  });
  // Cache hit renders real data on the very first paint — no loading state
  // needed. Cache miss (first-ever load on this browser) behaves as before.
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!cached) {
      setLoading(true);
      setError(null);
    }
    (async () => {
      try {
        const [meData, sitesData] = await Promise.all([getMe(), listSites()]);
        if (cancelled) return;
        setMe(meData);
        setSites(sitesData);
        writeSessionCache(meData, sitesData);
        const stored = localStorage.getItem(CURRENT_SITE_KEY);
        const initial =
          sitesData.find((s) => s.id === stored) ?? sitesData[0] ?? null;
        setCurrentSiteIdState(initial?.id ?? null);
      } catch (err) {
        // A cache hit already has something real on screen — a failed
        // background revalidation shouldn't blank it out with an error.
        if (!cancelled && !cached) {
          setError(
            err instanceof Error ? err.message : "Failed to load account",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  const setCurrentSiteId = useCallback((id: string) => {
    setCurrentSiteIdState(id);
    localStorage.setItem(CURRENT_SITE_KEY, id);
  }, []);

  const currentSite = sites.find((s) => s.id === currentSiteId) ?? null;

  return (
    <SessionContext.Provider
      value={{
        me,
        sites,
        currentSite,
        setCurrentSiteId,
        loading,
        error,
        refetch: () => setReloadNonce((n) => n + 1),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
