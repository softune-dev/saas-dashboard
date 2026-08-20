"use client";

import { useEffect, useState } from "react";
import { listOwnedTemplateKeys, listTemplates, type SiteOut } from "@/lib/api";
import { useSession } from "@/components/providers/session-provider";
import { ThemeCard } from "./theme-card";
import { themes } from "./themes-data";

/** Mirrors ThemeCard chrome so the load state doesn’t jump layout. */
function ThemeCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-2xl bg-surface px-1.5 pt-1.5 pb-3"
      aria-hidden
    >
      {/* Status pill stand-in */}
      <div className="relative mb-0">
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-search-bg" />
        </div>
      </div>
      <div
        className="aspect-[375/460] w-full animate-pulse bg-search-bg"
        style={{
          borderRadius: "0.5rem 0.5rem 1.25rem 1.25rem",
        }}
      />
      <div className="mt-2.5 flex items-center gap-2 px-1.5">
        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          <div className="h-4 w-3/4 max-w-[11rem] animate-pulse rounded-md bg-search-bg" />
          <div className="h-3 w-1/2 max-w-[8rem] animate-pulse rounded-md bg-search-bg" />
        </div>
        <div className="size-9 shrink-0 animate-pulse rounded-full bg-search-bg" />
      </div>
    </div>
  );
}

function ThemesGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Loading themes"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <ThemeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Each tenant is provisioned with exactly one site, tied to exactly one
 * template, at account-creation time (sites.template_id) — there is no
 * "which templates can this tenant use" permission to manage separately.
 * This just filters the catalog's static card list down to whichever
 * template(s) the tenant's own sites actually use, so an account never
 * even sees a card for a template it doesn't own (opening one directly
 * by URL is already blocked at the data layer — see theme-editor-view.tsx
 * — this is the matching UI-level guard).
 *
 * Reads `sites` from SessionProvider (already fetched once at app start)
 * instead of re-fetching /sites here — the earlier version called
 * listSites() itself on every mount, which meant every visit to this page
 * re-did a network round trip the app had already just done at login. Only
 * /templates (small, static) still needs fetching, and that's cached too
 * (see listTemplates in lib/api.ts) so it's a real request at most once. */
export function ThemesGrid() {
  const { sites, loading: sessionLoading } = useSession();
  const [ownedKeys, setOwnedKeys] = useState<Set<string> | null>(null);
  // template key -> the real site that uses it, so cards can show the
  // tenant's actual shop name instead of the catalog's fictional one.
  const [siteByKey, setSiteByKey] = useState<Map<string, SiteOut>>(new Map());

  useEffect(() => {
    if (sessionLoading) return;
    let cancelled = false;
    Promise.all([listOwnedTemplateKeys(sites), listTemplates()])
      .then(([keys, templates]) => {
        if (cancelled) return;
        setOwnedKeys(keys);
        const byTemplateId = new Map(templates.map((t) => [t.id, t.key]));
        const map = new Map<string, SiteOut>();
        for (const site of sites) {
          const key = byTemplateId.get(site.template_id);
          if (key) map.set(key, site);
        }
        setSiteByKey(map);
      })
      .catch(() => {
        if (!cancelled) setOwnedKeys(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, sites]);

  // Same pattern as Products/Courier: pulse chrome until ownership resolves
  // (previously returned null and left a blank gap under the heading).
  if (sessionLoading || ownedKeys === null) {
    return <ThemesGridSkeleton />;
  }

  // Locked cards (e.g. "Add Funnels") aren't tied to a real owned site —
  // they're an upsell placeholder, so they always show regardless of
  // ownership, unlike active cards which are filtered to what this tenant
  // actually has a site for.
  const ownedThemes = themes.filter(
    (theme) => theme.status === "locked" || ownedKeys.has(theme.id),
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {ownedThemes.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} site={siteByKey.get(theme.id) ?? null} />
      ))}
    </div>
  );
}
