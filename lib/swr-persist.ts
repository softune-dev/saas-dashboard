/**
 * Persists the SWR in-memory cache to localStorage across page reloads.
 *
 * SWR's cache normally lives only in memory — a hard refresh (or navigating
 * away and back via a full page load) wipes it, so every DB-backed page
 * (Categories/Products/Orders/Courier/Media/...) pays a full round trip to
 * Supabase again from a cold start. That round trip is the actual slow part
 * (the Supabase pooler adds real latency per query — see app/db.py's
 * statement_cache_size:0 comment), and it happens on EVERY reload, not just
 * the first visit.
 *
 * This restores the cache from localStorage on load, so a refresh renders
 * the last-known-good data instantly while SWR quietly revalidates each key
 * in the background (same stale-while-revalidate behavior SWR already uses
 * between page navigations) — the DB fetch still happens, it just no longer
 * blocks anything the user can see.
 */
import type { Cache } from "swr";

// Bump this suffix whenever an API response shape changes in a way that
// could crash a component reading a stale cached entry (a field renamed or
// added as required, not just an additive optional field) — e.g. Analytics
// gaining required visits/profit fields. A stale cache from before that
// change would otherwise survive both a page reload AND a backend restart
// (it's on disk, not in memory) and crash the first render before SWR's
// background revalidation can replace it with fresh data. Bumping this
// key makes every old entry simply invisible to the new provider, so it
// refetches clean instead of rehydrating something incompatible.
const STORAGE_KEY = "softune.swr.cache.v2";

export function localStorageProvider(): Cache {
  const map = new Map<string, unknown>(
    typeof window === "undefined" ? [] : readFromStorage(),
  );

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      try {
        // Only persist settled entries. A key whose fetch was still in
        // flight at unload time (data and error both undefined) would
        // otherwise get written as-is and rehydrated on the next load as a
        // permanent "still loading" snapshot — nothing ever flips it to
        // settled, since the in-flight request that would have done that
        // died with the old page. That's what caused the fraud page to get
        // stuck on its skeleton indefinitely after an interrupted load.
        const settled = Array.from(map.entries()).filter(([, value]) => {
          const entry = value as { data?: unknown; error?: unknown } | undefined;
          return entry && (entry.data !== undefined || entry.error !== undefined);
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settled));
      } catch {
        // Storage full or unavailable — losing the cache just means the next
        // load fetches fresh, same as today's behavior. Not fatal.
      }
    });
  }

  return map as unknown as Cache;
}

function readFromStorage(): [string, unknown][] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as [string, unknown][];
  } catch {
    return [];
  }
}
