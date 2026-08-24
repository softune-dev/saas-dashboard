"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { useToast } from "@/components/ui/toast";
import { findSiteByTemplateKey, getSiteTheme } from "@/lib/api";
import {
  listCategories,
  listProducts,
  type CategoryOut,
  type ProductOut,
} from "@/lib/api/commerce";
import type { Category as PickerCategory } from "@/components/categories/categories-data";
import type { Product as PickerProduct } from "@/components/products/products-data";
import {
  getDraftMissingKeys,
  hasThemeDraft,
  hasUnpublishedThemeDraft,
  loadThemeDraft,
  loadThemePublished,
  saveThemeDraft,
  seedThemeFromRemote,
  THEME_STORE_EVENT,
} from "../theme-store";
import { usePublishTheme } from "../use-publish-theme";
import { PublishConfirmModal } from "./publish-confirm-modal";
import {
  pageCatalog,
  pageSupportsContentEdit,
  pageSupportsSections,
  sectionCatalog,
  SIDEBAR_DEFAULT,
  type DeviceId,
  type EditorPanelId,
  type SectionType,
  type SiteEditorSettings,
  type SitePage,
  type SitePageType,
} from "./editor-types";
import { EditorSidebar } from "./editor-sidebar";
import { SitePreview } from "./site-preview";
import { summarizeThemeChanges } from "./theme-diff";
import { UnsavedModal } from "./unsaved-modal";

function snapshot(settings: SiteEditorSettings) {
  return JSON.stringify(settings);
}

type ThemeEditorViewProps = {
  /** Which site card this editor belongs to — namespaces draft/published storage. */
  siteId: string;
  /** This site's preview server, e.g. Aurora on localhost:3050. */
  previewUrl?: string;
};

export function ThemeEditorView({ siteId, previewUrl }: ThemeEditorViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const goThemes = useCallback(() => {
    router.push("/themes");
  }, [router]);

  // Hydrate from last saved draft (client), scoped to this site.
  const [settings, setSettings] = useState<SiteEditorSettings>(() =>
    loadThemeDraft(siteId),
  );
  const [saved, setSaved] = useState<SiteEditorSettings>(() =>
    loadThemeDraft(siteId),
  );
  // undefined = lookup still in flight; string = resolved host for ?__site=;
  // null = lookup finished with no host (API miss) — preview may load without
  // __site rather than hang on the spinner forever.
  const [siteHost, setSiteHost] = useState<string | null | undefined>(undefined);
  // True once this site has published at least once — its real domain then
  // has actual content to show. Neither preview mechanism reflects
  // in-progress edits (nothing here pushes unsaved settings to any backend
  // or iframe; save() only writes localStorage until Publish), so both
  // sources show the same last-published theme — the only real difference
  // is freshness after a fresh publish.
  const [sitePublished, setSitePublished] = useState(false);
  // Cosmetic only: siteHost is either a full custom_domain already, or a
  // bare subdomain that needs SITE_BASE_DOMAIN appended to look real.
  const displayHost = siteHost
    ? siteHost.includes(".")
      ? siteHost
      : `${siteHost}.${process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softune.xyz"}`
    : null;
  // Prefer the site's real domain once it exists: the worker's on-demand
  // revalidate call after publish targets that exact host, while the shared
  // saas-themeN.vercel.app preview URL can keep serving its own separately
  // cached copy for longer. Falls back to the shared preview deployment for
  // a site that has never published — its real domain has nothing to show
  // yet ("Site unavailable").
  const effectivePreviewUrl =
    sitePublished && displayHost ? `https://${displayHost}` : previewUrl;
  // The real backend site id (a UUID) — different from the `siteId` prop,
  // which is the template key ("aurora") used to namespace local storage.
  // Media uploads need the real id since that's what the API is scoped to.
  const [realSiteId, setRealSiteId] = useState<string | null>(null);
  // False only for the very first-ever visit to a site's editor, while the
  // real backend theme is still in flight — the sidebar shows this template's
  // hardcoded placeholder copy (editor-defaults.ts) as the initial `settings`
  // value, and briefly rendering that as if it were the merchant's real site
  // name/tagline/etc. reads as a bug, not a loading state. Sites with an
  // existing draft skip this entirely since that draft IS already real,
  // customer-owned content.
  const [themeReady, setThemeReady] = useState(() => hasThemeDraft(siteId));

  // Real catalog for the Categories/Feature Products/Category Showcase/
  // Product Showcase pickers — these used to read the dashboard's own mock
  // catalog (categories-data.ts/products-data.ts), which meant the ids they
  // stored didn't correspond to anything real. Fetched once realSiteId
  // resolves; empty until then (pickers show their own "no categories yet"
  // state rather than a loading flicker, since this is typically instant).
  const [rawCategories, setRawCategories] = useState<CategoryOut[]>([]);
  const [rawProducts, setRawProducts] = useState<ProductOut[]>([]);

  useEffect(() => {
    if (!realSiteId) return;
    let cancelled = false;
    (async () => {
      const [cats, prods] = await Promise.all([
        listCategories(realSiteId).catch(() => []),
        listProducts(realSiteId, { limit: 100 }).catch(() => ({ items: [], total: 0, limit: 100, offset: 0 })),
      ]);
      if (cancelled) return;
      setRawCategories(cats);
      setRawProducts(prods.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [realSiteId]);

  // Adapted into the shape the picker components (entity-picker.tsx) were
  // already built against — the same shape the dashboard's Categories/
  // Products pages themselves display, minus fields those pickers don't
  // need. Keeps entity-picker.tsx itself untouched.
  const catalogCategories = useMemo<PickerCategory[]>(
    () =>
      rawCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image_url ?? "",
        products: rawProducts.filter((p) => p.category_id === c.id).length,
        status: c.is_active ? "Active" : "Inactive",
        updatedAt: "",
      })),
    [rawCategories, rawProducts],
  );
  const catalogProducts = useMemo<PickerProduct[]>(
    () =>
      rawProducts.map((p) => ({
        id: p.id,
        productId: p.sku ?? p.id,
        name: p.name,
        image: p.images?.[0]?.url ?? "",
        category:
          rawCategories.find((c) => c.id === p.category_id)?.name ?? "Uncategorized",
        variantKind: "size" as const,
        options: [{ id: p.id, value: "Default", price: p.price_cents / 100, stock: p.stock }],
        status: p.is_active ? "Published" : ("Draft" as const),
        updatedAt: "",
      })),
    [rawProducts, rawCategories],
  );

  useEffect(() => {
    const draft = loadThemeDraft(siteId);
    setSettings(draft);
    setSaved(draft);
    // Re-enter unresolved so the preview iframe does not mount with a stale
    // host (or without __site) while the new lookup is in flight.
    setSiteHost(undefined);
    setSitePublished(false);
    setRealSiteId(null);
    setThemeReady(hasThemeDraft(siteId));

    // First time this site's editor has ever opened on this browser: pull
    // the real theme from the backend instead of showing the built-in
    // placeholder content. After that, the customer's own local edits are
    // the source of truth until they publish again.
    let cancelled = false;
    (async () => {
      const site = await findSiteByTemplateKey(siteId).catch(() => null);
      if (cancelled) return;
      if (!site) {
        // No site under this tenant uses this template — either a typed-in
        // URL for a template they don't own, or a template with no site yet.
        // ThemesGrid already hides the card for this case; this is the
        // matching guard for anyone who navigates here directly.
        goThemes();
        return;
      }
      // The preview must render THIS site, not whatever SITE_HOST happens to
      // be baked into the template's .env — otherwise you publish to one site
      // and watch another one for changes that never come.
      setSiteHost(site.custom_domain || site.subdomain);
      setSitePublished(site.status === "published");
      setRealSiteId(site.id);

      if (!hasThemeDraft(siteId)) {
        const theme = await getSiteTheme(site.id).catch(() => null);
        if (cancelled) return;
        if (!theme) {
          // Real theme genuinely unavailable (e.g. API error) — fall back to
          // the placeholder rather than hang on the loading state forever.
          setThemeReady(true);
          return;
        }
        const remote = theme as unknown as SiteEditorSettings;
        seedThemeFromRemote(siteId, remote);
        setSettings(remote);
        setSaved(remote);
        setThemeReady(true);
        return;
      }

      // A draft already exists, so it stays the source of truth for
      // anything the customer has actually touched — but the schema may have
      // grown fields since it was last saved (this session alone added
      // hero images, nav routes, and this footer). Those missing keys were
      // just silently filled with this template's default placeholder
      // content by loadThemeDraft(); replace only THOSE keys with the site's
      // real remote values, once we have them.
      const missing = getDraftMissingKeys(siteId);
      if (missing.length === 0) return;
      const theme = await getSiteTheme(site.id).catch(() => null);
      if (!theme || cancelled) return;
      const remote = theme as unknown as SiteEditorSettings;
      const patch = Object.fromEntries(
        missing.map((key) => [key, remote[key]]),
      ) as Partial<SiteEditorSettings>;
      // draft is the value loaded at the top of this effect — reading from it
      // rather than the (possibly stale-by-now) `settings` closure, and
      // avoiding a functional setState update whose updater would otherwise
      // need this same side effect (saveThemeDraft) baked into it.
      const merged = { ...draft, ...patch };
      saveThemeDraft(siteId, merged);
      setSettings(merged);
      setSaved(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId, goThemes]);
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [panel, setPanel] = useState<EditorPanelId>("brand");
  const [activePageId, setActivePageId] = useState(() => {
    const draft = loadThemeDraft(siteId);
    return (
      draft.pages.find((p) => p.type === "home")?.id ??
      draft.pages[0]?.id ??
      ""
    );
  });
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState<number | undefined>(undefined);
  const {
    loginOpen,
    setLoginOpen,
    confirmOpen,
    setConfirmOpen,
    publishing,
    progress,
    requestPublish,
    publishNow,
  } = usePublishTheme(siteId);

  const dirty = useMemo(
    () => snapshot(settings) !== snapshot(saved),
    [settings, saved],
  );

  // What Publish would actually push live, compared against the live theme
  // — computed fresh each time the modal opens (confirmOpen flips true)
  // rather than kept in state, so it can't go stale while the modal is up.
  const publishChanges = useMemo(
    () => (confirmOpen ? summarizeThemeChanges(settings, loadThemePublished(siteId)) : []),
    [confirmOpen, settings, siteId],
  );

  // Nothing to publish when the editor is clean AND the saved draft already
  // matches what's live. Tracked in state because localStorage changes don't
  // trigger a re-render on their own.
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const refreshUnpublished = useCallback(() => {
    setHasUnpublished(hasUnpublishedThemeDraft(siteId));
  }, [siteId]);

  useEffect(() => {
    refreshUnpublished();
    window.addEventListener(THEME_STORE_EVENT, refreshUnpublished);
    return () => {
      window.removeEventListener(THEME_STORE_EVENT, refreshUnpublished);
    };
  }, [refreshUnpublished]);

  const rawActivePage =
    settings.pages.find((p) => p.id === activePageId) ?? settings.pages[0];

  // The Product Details page's route is a template placeholder ("/shop/:slug")
  // — there is no real product at that literal URL, so loading it as-is 404s.
  // Substitute the real slug of whichever product the sidebar's picker has
  // selected (settings.showcaseProductId) before it ever reaches the iframe.
  const activePage =
    rawActivePage?.type === "productDetail" && rawActivePage.path.includes(":slug")
      ? {
          ...rawActivePage,
          path: rawActivePage.path.replace(
            ":slug",
            rawProducts.find((p) => p.id === settings.showcaseProductId)?.slug ?? ":slug",
          ),
        }
      : rawActivePage;

  const patch = useCallback((partial: Partial<SiteEditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const addSection = useCallback((type: SectionType) => {
    setSettings((prev) => ({
      ...prev,
      sections: [...prev.sections, { id: `s-${Date.now()}`, type }],
    }));
  }, []);

  const removeSection = useCallback(
    (id: string) => {
      setSettings((prev) => {
        const target = prev.sections.find((s) => s.id === id);
        const next = prev.sections.filter((s) => s.id !== id);
        if (target && panel === target.type) {
          setPanel("sections");
        }
        return { ...prev, sections: next };
      });
    },
    [panel],
  );

  const reorderSections = useCallback(
    (sections: SiteEditorSettings["sections"]) => {
      setSettings((prev) => ({ ...prev, sections }));
    },
    [],
  );

  const changePage = useCallback((id: string, pagePatch: Partial<SitePage>) => {
    setSettings((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id ? { ...p, ...pagePatch } : p,
      ),
    }));
  }, []);

  const addPage = useCallback((type: SitePageType) => {
    const meta = pageCatalog.find((p) => p.type === type);
    if (!meta) return;
    const id = `p-${Date.now()}`;
    setSettings((prev) => ({
      ...prev,
      pages: [
        ...prev.pages,
        {
          id,
          type,
          title: meta.title,
          path: meta.path,
          enabled: true,
        },
      ],
    }));
    // Stay on Pages panel; set preview to new page
    setActivePageId(id);
  }, []);

  const removePage = useCallback(
    (id: string) => {
      setSettings((prev) => {
        const target = prev.pages.find((p) => p.id === id);
        if (target?.type === "home") return prev;
        const next = prev.pages.filter((p) => p.id !== id);
        if (activePageId === id) {
          const home = next.find((p) => p.type === "home") ?? next[0];
          setActivePageId(home?.id ?? "");
        }
        return { ...prev, pages: next };
      });
    },
    [activePageId],
  );

  const handleActivePageChange = useCallback(
    (id: string) => {
      setActivePageId(id);
      const page = settings.pages.find((p) => p.id === id);
      if (!page) return;

      const isSectionPanel = sectionCatalog.some((s) => s.type === panel);

      // No "1" edit tool — leave pageContent
      if (panel === "pageContent" && !pageSupportsContentEdit(page.type)) {
        setPanel("pages");
        return;
      }

      // Section tools only apply on home
      if (
        (panel === "sections" || isSectionPanel) &&
        !pageSupportsSections(page.type)
      ) {
        setPanel("pages");
      }
    },
    [panel, settings.pages],
  );

  const save = useCallback(() => {
    setSaved(settings);
    saveThemeDraft(siteId, settings);
    toast({
      title: "Draft saved",
      description: "Publish from Themes when you are ready to go live.",
      variant: "success",
    });
  }, [settings, toast, siteId]);

  // Publish must always act on what's currently in the editor, not a stale
  // localStorage draft from before the last edit — so save first if dirty.
  const handlePublishClick = useCallback(() => {
    if (dirty) {
      setSaved(settings);
      saveThemeDraft(siteId, settings);
    }
    requestPublish();
  }, [dirty, settings, siteId, requestPublish]);

  const handleConfirmPublish = useCallback(async () => {
    const ok = await publishNow();
    setConfirmOpen(false);
    refreshUnpublished();
    // Force the preview iframe to reload past its cache so the just-published
    // change is visible immediately instead of requiring a manual refresh.
    if (ok) setRefreshSignal(Date.now());
  }, [publishNow, setConfirmOpen, refreshUnpublished]);

  const handleBack = useCallback(() => {
    if (dirty) {
      setLeaveOpen(true);
      return;
    }
    goThemes();
  }, [dirty, goThemes]);

  const handleSaveAndLeave = useCallback(() => {
    setSaved(settings);
    saveThemeDraft(siteId, settings);
    setLeaveOpen(false);
    toast({
      title: "Draft saved",
      description: "Publish from Themes when you are ready to go live.",
      variant: "success",
    });
    goThemes();
  }, [settings, toast, goThemes, siteId]);

  // Mobile (< md): Edit | Preview tabs instead of side-by-side.
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-2 md:flex-row md:gap-3">
        <div className="flex shrink-0 gap-1 rounded-full bg-surface p-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={[
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              mobileTab === "edit"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={[
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              mobileTab === "preview"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            Preview
          </button>
        </div>

        <div
          className={[
            "min-h-0 min-w-0",
            mobileTab === "edit" ? "flex flex-1" : "hidden",
            // flex-1 above is mobile-only (full-width Edit tab). On desktop the
            // sidebar must NOT grow — md:shrink-0 alone doesn't cancel the
            // flex-grow:1 it inherits from flex-1, so without md:flex-none it
            // competes with the preview panel for free space and leaves a
            // large empty gap between the sidebar's real (fixed) width and
            // the preview panel that starts after its inflated flex-basis.
            "md:flex md:h-full md:shrink-0 md:flex-none",
          ].join(" ")}
        >
          <EditorSidebar
            settings={settings}
            loading={!themeReady}
            siteId={realSiteId}
            themeId={siteId}
            previewUrl={effectivePreviewUrl}
            categories={catalogCategories}
            products={catalogProducts}
            panel={panel}
            activePageId={activePage?.id ?? ""}
            dirty={dirty}
            collapsed={collapsed}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            onCollapsedChange={setCollapsed}
            onPanelChange={setPanel}
            onActivePageChange={handleActivePageChange}
            onChange={patch}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onReorderSections={reorderSections}
            onChangePage={changePage}
            onAddPage={addPage}
            onRemovePage={removePage}
            onBack={handleBack}
            onSave={save}
          />
        </div>

        <div
          className={[
            "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface",
            mobileTab === "preview" ? "flex" : "hidden",
            "md:flex",
          ].join(" ")}
          data-tour="editor-preview"
        >
          <SitePreview
            settings={settings}
            activePage={activePage}
            device={device}
            onDeviceChange={setDevice}
            previewUrl={effectivePreviewUrl}
            siteHost={sitePublished ? null : siteHost}
            displayHost={displayHost}
            refreshSignal={refreshSignal}
            onPublishClick={handlePublishClick}
            publishing={publishing}
            publishDisabled={!dirty && !hasUnpublished}
          />
        </div>
      </div>

      <UnsavedModal
        open={leaveOpen}
        onSave={handleSaveAndLeave}
        onDiscard={() => {
          setLeaveOpen(false);
          goThemes();
        }}
        onDismiss={() => setLeaveOpen(false)}
      />

      <LoginModal
        open={loginOpen}
        onSuccess={() => {
          setLoginOpen(false);
          setConfirmOpen(true);
        }}
        onDismiss={() => setLoginOpen(false)}
      />
      <PublishConfirmModal
        open={confirmOpen}
        publishing={publishing}
        progress={progress}
        changes={publishChanges}
        onConfirm={handleConfirmPublish}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
