"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { Category as PickerCategory } from "@/components/categories/categories-data";
import type { Product as PickerProduct } from "@/components/products/products-data";
import {
  EditorField,
  EditorInput,
  IconPicker,
  SegmentedControl,
} from "./editor-field";
import {
  CategoryPicker,
  ProductPicker,
  ProductSinglePicker,
} from "./entity-picker";
import {
  pageSupportsContentEdit,
  pageSupportsSections,
  sectionCatalog,
  sectionLabel,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  SIDEBAR_RAIL,
  type ColorPalette,
  type EditorPanelId,
  type SectionType,
  type SiteEditorSettings,
  type SitePage,
  type SitePageType,
} from "./editor-types";
import { getColorPalettes } from "./editor-defaults";
import { AnnouncementItemsEditor } from "./announcement-items-editor";
import { BrandColorsHeaderPanel } from "./brand-colors-header-panel";
import { HeroImagePicker, SingleImagePicker } from "./hero-image-picker";
import { NavLinkListEditor } from "./nav-link-list-editor";
import { PagesManager } from "./pages-manager";
import { TestimonialsEditor } from "./testimonials-editor";

/** Toolbar tools — icons from /public/sidebar.
 * Brand/Colors/Header/Sections used to be four separate rail icons, each
 * jumping to its own full panel. They're one merged accordion panel now
 * (see brand-colors-header-panel.tsx) — one rail icon opens it, and which
 * group is expanded lives inside that panel's own state, not the rail. */
const globalTools: { id: EditorPanelId; label: string; icon: string }[] = [
  { id: "brand", label: "Design", icon: "/sidebar/brand.svg" },
  { id: "pages", label: "Pages", icon: "/sidebar/page.svg" },
];

type EditorSidebarProps = {
  settings: SiteEditorSettings;
  /** True only while the real backend theme is still loading for a
   * brand-new site (see theme-editor-view.tsx's themeReady) — panel fields
   * show a skeleton instead of `settings`, which is this template's generic
   * placeholder copy until the real fetch resolves. */
  loading?: boolean;
  /** Real backend site id, for media uploads. Null until resolved on mount. */
  siteId: string | null;
  /** Template key from themes-data (aurora | bazaar | sweets) — picks
   * per-theme color palettes / placeholder content. Not the backend UUID. */
  themeId: string;
  /** This site's preview server — media thumbnails resolve relative paths
   * against it (see resolveMediaUrl in editor-types.ts). */
  previewUrl?: string;
  /** Real backend catalog — feeds the Categories/Feature Products/Category
   * Showcase/Product Showcase pickers. Empty until siteId resolves. */
  categories: PickerCategory[];
  products: PickerProduct[];
  panel: EditorPanelId;
  activePageId: string;
  dirty: boolean;
  collapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onCollapsedChange: (v: boolean) => void;
  onPanelChange: (id: EditorPanelId) => void;
  onActivePageChange: (id: string) => void;
  onChange: (patch: Partial<SiteEditorSettings>) => void;
  onAddSection: (type: SectionType) => void;
  onRemoveSection: (id: string) => void;
  onReorderSections: (sections: SiteEditorSettings["sections"]) => void;
  onChangePage: (id: string, patch: Partial<SitePage>) => void;
  onAddPage: (type: SitePageType) => void;
  onRemovePage: (id: string) => void;
  onBack: () => void;
  onSave: () => void;
};

export function EditorSidebar({
  settings,
  loading,
  siteId,
  themeId,
  previewUrl,
  categories,
  products,
  panel,
  activePageId,
  dirty,
  collapsed,
  width,
  onWidthChange,
  onCollapsedChange,
  onPanelChange,
  onActivePageChange,
  onChange,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onChangePage,
  onAddPage,
  onRemovePage,
  onBack,
  onSave,
}: EditorSidebarProps) {
  // Resolve once at the shell — avoid free-variable lookup inside PanelFields
  // (Turbopack HMR has dropped the import binding there before).
  const themePalettes = getColorPalettes(themeId);

  const activePage =
    settings.pages.find((p) => p.id === activePageId) ?? settings.pages[0];
  const showSectionRail = activePage
    ? pageSupportsSections(activePage.type)
    : false;
  const showPageContentRail =
    !!activePage &&
    !showSectionRail &&
    pageSupportsContentEdit(activePage.type);

  /** Rail section tools use homepage order numbers (1…n) */
  const sectionTools = showSectionRail
    ? settings.sections.map((s, index) => ({
        id: s.type as EditorPanelId,
        sectionId: s.id,
        label: sectionLabel(s.type),
        order: index + 1,
      }))
    : [];

  const availableToAdd = sectionCatalog.filter(
    (c) => !settings.sections.some((s) => s.type === c.type),
  );

  const activeSection = settings.sections.find((s) => s.type === panel);
  const resizing = useRef(false);
  const toolsScrollRef = useRef<HTMLDivElement>(null);
  const [toolsFadeBottom, setToolsFadeBottom] = useState(false);
  const [toolsFadeTop, setToolsFadeTop] = useState(false);

  /** Select a tool; if the rail is collapsed, expand the panel for that section */
  const selectPanel = useCallback(
    (id: EditorPanelId) => {
      onPanelChange(id);
      if (collapsed) onCollapsedChange(false);
    },
    [collapsed, onCollapsedChange, onPanelChange],
  );

  const updateToolsFade = useCallback(() => {
    const el = toolsScrollRef.current;
    if (!el) {
      setToolsFadeBottom(false);
      setToolsFadeTop(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canScroll = scrollHeight > clientHeight + 2;
    setToolsFadeTop(canScroll && scrollTop > 4);
    setToolsFadeBottom(
      canScroll && scrollTop + clientHeight < scrollHeight - 4,
    );
  }, []);

  useEffect(() => {
    updateToolsFade();
    const el = toolsScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateToolsFade, { passive: true });
    const ro = new ResizeObserver(updateToolsFade);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateToolsFade);
      ro.disconnect();
    };
  }, [updateToolsFade, sectionTools.length, showSectionRail, activePageId]);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (collapsed) return;
      event.preventDefault();
      resizing.current = true;
      const startX = event.clientX;
      const startW = width;

      const onMove = (e: PointerEvent) => {
        if (!resizing.current) return;
        const next = Math.min(
          SIDEBAR_MAX,
          Math.max(SIDEBAR_MIN, startW + (e.clientX - startX)),
        );
        onWidthChange(next);
      };

      const onUp = () => {
        resizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [collapsed, onWidthChange, width],
  );

  // On narrow viewports keep the panel expanded — collapse is desktop-only.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const effectivelyCollapsed = narrow ? false : collapsed;
  // Collapsed = tools rail only; never narrower than the rail itself
  const displayWidth = effectivelyCollapsed
    ? SIDEBAR_RAIL
    : Math.max(width, SIDEBAR_MIN);

  return (
    <aside
      data-tour="editor-sidebar"
      style={narrow ? undefined : { width: displayWidth }}
      className="relative flex h-full w-full shrink-0 overflow-hidden rounded-2xl bg-surface transition-[width] duration-150 ease-out md:w-auto"
    >
      {/* Tools rail — fixed width always matches SIDEBAR_RAIL */}
      <div
        data-tour="editor-tools"
        style={{ width: SIDEBAR_RAIL }}
        className="flex shrink-0 flex-col items-center gap-1.5 border-r border-border dark:border-transparent py-3"
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-search-bg"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mb-1 hidden size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground md:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-5" strokeWidth={1.75} />
          )}
        </button>

        {/* Global tools stay fixed — only number rail scrolls */}
        <div className="flex w-full shrink-0 flex-col items-center gap-1.5 px-1">
          {globalTools.map(({ id, label, icon }) => (
            <RailButton
              key={id}
              label={label}
              active={panel === id}
              onClick={() => selectPanel(id)}
              tourId={`editor-tool-${id}`}
            >
              <MaskIcon src={icon} className="size-5" />
            </RailButton>
          ))}
        </div>

        {(showSectionRail || showPageContentRail) && (
          <span className="my-1.5 h-px w-7 shrink-0 bg-search-bg" />
        )}

        <div className="relative min-h-0 w-full flex-1">
          <div
            ref={toolsScrollRef}
            data-tour="editor-section-rail"
            className="scrollbar-none flex h-full w-full flex-col items-center gap-1.5 overflow-y-auto overscroll-contain px-1"
          >
            {showSectionRail
              ? sectionTools.map(({ id, label, order, sectionId }) => (
                  <NumberRailButton
                    key={sectionId}
                    label={`${order}. ${label}`}
                    active={panel === id}
                    onClick={() => selectPanel(id)}
                  >
                    {order}
                  </NumberRailButton>
                ))
              : showPageContentRail
                ? (
                    <NumberRailButton
                      label={`Edit ${activePage?.title}`}
                      active={panel === "pageContent"}
                      onClick={() => selectPanel("pageContent")}
                    >
                      1
                    </NumberRailButton>
                  )
                : null}
          </div>

          {/* Fade + arrows only on the numbers list (absolute, no layout shift) */}
          {toolsFadeTop ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-surface to-transparent"
              />
              <button
                type="button"
                aria-label="Scroll sections up"
                onClick={() => {
                  toolsScrollRef.current?.scrollBy({
                    top: -72,
                    behavior: "smooth",
                  });
                }}
                className="absolute top-0.5 left-1/2 z-10 inline-flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-muted-soft ring-1 ring-border dark:ring-transparent transition-colors hover:text-foreground"
              >
                <ChevronUp className="size-3.5" strokeWidth={2.25} />
              </button>
            </>
          ) : null}
          {toolsFadeBottom ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent"
              />
              <button
                type="button"
                aria-label="Scroll sections down"
                onClick={() => {
                  toolsScrollRef.current?.scrollBy({
                    top: 72,
                    behavior: "smooth",
                  });
                }}
                className="absolute bottom-0.5 left-1/2 z-10 inline-flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-muted-soft ring-1 ring-border dark:ring-transparent transition-colors hover:text-foreground"
              >
                <ChevronDown className="size-3.5" strokeWidth={2.25} />
              </button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!dirty}
          aria-label="Save"
          title="Save"
          className={[
            "mt-1.5 inline-flex size-11 items-center justify-center rounded-full transition-colors",
            dirty
              ? "bg-primary text-white hover:opacity-90"
              : "text-slate-300",
          ].join(" ")}
        >
          <MaskIcon src="/sidebar/save.svg" className="size-5" />
        </button>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {!effectivelyCollapsed ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-w-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border dark:border-transparent px-4">
              <p className="truncate text-sm font-semibold text-foreground">
                {panelTitle(panel, activePage?.title)}
              </p>
              {activeSection && isSectionType(panel) ? (
                <button
                  type="button"
                  aria-label="Remove section"
                  onClick={() => onRemoveSection(activeSection.id)}
                  className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
              {loading ? (
                <PanelFieldsSkeleton />
              ) : (
                <div key={panel} className="flex min-h-full flex-col gap-4">
                  <PanelFields
                    panel={panel}
                    settings={settings}
                    siteId={siteId}
                    themePalettes={themePalettes}
                    previewUrl={previewUrl}
                    categories={categories}
                    products={products}
                    activePageId={activePageId}
                    onChange={onChange}
                    availableToAdd={availableToAdd}
                    onAddSection={onAddSection}
                    onRemoveSection={onRemoveSection}
                    onReorderSections={onReorderSections}
                    onActivePageChange={onActivePageChange}
                    onPanelChange={onPanelChange}
                    onChangePage={onChangePage}
                    onAddPage={onAddPage}
                    onRemovePage={onRemovePage}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Right-edge resize handle (extension width) — desktop only */}
      {!effectivelyCollapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={onResizePointerDown}
          className="group absolute top-0 right-0 z-20 hidden h-full w-2 cursor-col-resize items-center justify-center md:flex"
        >
          <span className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-active:bg-primary" />
        </div>
      ) : null}
    </aside>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
  tourId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tourId?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      data-tour={tourId}
      className={[
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-primary text-white"
          : "text-muted hover:bg-search-bg hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** Section / page-content numbers: border only, hover white */
function NumberRailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={[
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-transparent text-muted hover:border-muted-soft hover:bg-surface",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function isSectionType(id: EditorPanelId): id is SectionType {
  return sectionCatalog.some((s) => s.type === id);
}

/** Shown in place of PanelFields while the real theme is still loading — see
 * EditorSidebarProps.loading. Generic field-shaped blocks, not tied to any
 * specific panel, since which panel is active is arbitrary at this point. */
function PanelFieldsSkeleton() {
  return (
    <div className="flex min-h-full animate-pulse flex-col gap-4">
      <div className="h-9 w-full rounded-lg bg-search-bg" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-16 rounded bg-search-bg" />
        <div className="h-9 w-full rounded-lg bg-search-bg" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-16 rounded bg-search-bg" />
        <div className="h-9 w-full rounded-lg bg-search-bg" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-20 rounded bg-search-bg" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-lg bg-search-bg" />
          <div className="h-14 rounded-lg bg-search-bg" />
          <div className="h-14 rounded-lg bg-search-bg" />
        </div>
      </div>
    </div>
  );
}

function panelTitle(panel: EditorPanelId, pageTitle?: string): string {
  // Brand/Colors/Header/Sections all render the same merged accordion
  // panel now — the title bar can't say which group is expanded (that
  // state lives inside the panel itself), so it names the panel, not a
  // specific group.
  if (panel === "brand" || panel === "colors" || panel === "header" || panel === "sections") {
    return "Design";
  }
  if (panel === "pages") return "Pages";
  if (panel === "pageContent") return pageTitle ? `${pageTitle} content` : "Page content";
  return sectionLabel(panel as SectionType);
}

function PanelFields({
  panel,
  settings,
  siteId,
  themePalettes,
  previewUrl,
  categories,
  products,
  activePageId,
  onChange,
  availableToAdd,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onActivePageChange,
  onPanelChange,
  onChangePage,
  onAddPage,
  onRemovePage,
}: {
  panel: EditorPanelId;
  settings: SiteEditorSettings;
  siteId: string | null;
  /** Color presets for this template (from getColorPalettes(themeId)). */
  themePalettes: ColorPalette[];
  previewUrl?: string;
  categories: PickerCategory[];
  products: PickerProduct[];
  activePageId: string;
  onChange: (p: Partial<SiteEditorSettings>) => void;
  availableToAdd: { type: SectionType; label: string }[];
  onAddSection: (type: SectionType) => void;
  onRemoveSection: (id: string) => void;
  onReorderSections: (sections: SiteEditorSettings["sections"]) => void;
  onActivePageChange: (id: string) => void;
  onPanelChange: (id: EditorPanelId) => void;
  onChangePage: (id: string, patch: Partial<SitePage>) => void;
  onAddPage: (type: SitePageType) => void;
  onRemovePage: (id: string) => void;
}) {
  const activePage =
    settings.pages.find((p) => p.id === activePageId) ?? settings.pages[0];
  if (panel === "brand" || panel === "colors" || panel === "header" || panel === "sections") {
    return (
      <BrandColorsHeaderPanel
        initialGroup={null}
        settings={settings}
        siteId={siteId}
        themePalettes={themePalettes}
        previewUrl={previewUrl}
        activePageId={activePageId}
        onChange={onChange}
        availableToAdd={availableToAdd}
        onAddSection={onAddSection}
        onRemoveSection={onRemoveSection}
        onReorderSections={onReorderSections}
        onActivePageChange={onActivePageChange}
      />
    );
  }

  if (panel === "pages") {
    return (
      <div data-tour="editor-pages">
        <PagesManager
          pages={settings.pages}
          activePageId={activePageId}
          onActivePageChange={onActivePageChange}
          onChangePage={onChangePage}
          onAddPage={onAddPage}
          onRemovePage={onRemovePage}
        />
      </div>
    );
  }

  if (panel === "pageContent") {
    if (!activePage) {
      return <p className="text-sm text-muted">Select a page to edit.</p>;
    }
    if (pageSupportsSections(activePage.type)) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Home uses numbered section tools in the rail.
          </p>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-3 text-sm font-semibold text-white"
            onClick={() => onPanelChange("sections")}
          >
            Manage sections
          </button>
        </div>
      );
    }
    if (!pageSupportsContentEdit(activePage.type)) {
      return (
        <p className="text-sm text-muted">
          This page is system-managed and has no content editor. Preview only.
        </p>
      );
    }
    return (
      <PageContentFields
        type={activePage.type}
        settings={settings}
        onChange={onChange}
        categories={categories}
        products={products}
      />
    );
  }

  if (panel === "banner") {
    return (
      <AnnouncementItemsEditor
        items={settings.announcementItems ?? []}
        divider={settings.announcementDivider ?? "✦"}
        onItemsChange={(announcementItems) => onChange({ announcementItems })}
        onDividerChange={(announcementDivider) =>
          onChange({ announcementDivider })
        }
      />
    );
  }

  if (panel === "hero") {
    return (
      <>
        <HeroImagePicker
          label="Desktop & mobile (16:9)"
          siteId={siteId}
          previewUrl={previewUrl}
          selected={settings.heroImages}
          onChange={(heroImages) => onChange({ heroImages })}
          aspect="video"
        />
        <HeroImagePicker
          label="Mobile only (1:1)"
          siteId={siteId}
          previewUrl={previewUrl}
          selected={settings.heroImagesSquare}
          onChange={(heroImagesSquare) => onChange({ heroImagesSquare })}
          aspect="square"
        />
      </>
    );
  }

  if (panel === "categories") {
    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.categoriesTitle}
            onChange={(v) => onChange({ categoriesTitle: v })}
          />
        </EditorField>
        <CategoryPicker
          selectedIds={settings.selectedCategoryIds}
          options={categories}
          onChange={(ids) => onChange({ selectedCategoryIds: ids })}
        />
      </>
    );
  }

  if (panel === "featureProducts") {
    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.featureProductsTitle}
            onChange={(v) => onChange({ featureProductsTitle: v })}
          />
        </EditorField>
        <ProductPicker
          selectedIds={settings.selectedProductIds}
          options={products}
          onChange={(ids) => onChange({ selectedProductIds: ids })}
          label="Featured products"
        />
      </>
    );
  }

  if (panel === "productShowcase") {
    // Title, price, sizes, and CTAs come from the product — only the pick.
    // Full-width list (no nested container) so the tab is just the catalog.
    return (
      <ProductSinglePicker
        value={settings.showcaseProductId}
        options={products}
        onChange={(id) => onChange({ showcaseProductId: id })}
      />
    );
  }

  if (panel === "whyChooseUs") {
    return (
      <>
        <EditorField label="Section title">
          <EditorInput
            value={settings.whyTitle}
            onChange={(v) => onChange({ whyTitle: v })}
          />
        </EditorField>
        <SingleImagePicker
          label="Image"
          siteId={siteId}
          previewUrl={previewUrl}
          value={settings.whyImage ?? ""}
          onChange={(v) => onChange({ whyImage: v })}
        />
        <EditorField label="Point 1 — title">
          <EditorInput
            value={settings.why1Title ?? ""}
            onChange={(v) => onChange({ why1Title: v })}
          />
        </EditorField>
        <EditorField label="Point 1 — body">
          <EditorInput
            value={settings.why1}
            onChange={(v) => onChange({ why1: v })}
          />
        </EditorField>
        <EditorField label="Point 2 — title">
          <EditorInput
            value={settings.why2Title ?? ""}
            onChange={(v) => onChange({ why2Title: v })}
          />
        </EditorField>
        <EditorField label="Point 2 — body">
          <EditorInput
            value={settings.why2}
            onChange={(v) => onChange({ why2: v })}
          />
        </EditorField>
        <EditorField label="Point 3 — title">
          <EditorInput
            value={settings.why3Title ?? ""}
            onChange={(v) => onChange({ why3Title: v })}
          />
        </EditorField>
        <EditorField label="Point 3 — body">
          <EditorInput
            value={settings.why3}
            onChange={(v) => onChange({ why3: v })}
          />
        </EditorField>
      </>
    );
  }

  if (panel === "categoryShowcase") {
    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.categoryShowcaseTitle ?? ""}
            onChange={(v) => onChange({ categoryShowcaseTitle: v })}
          />
        </EditorField>
        <CategoryPicker
          selectedIds={settings.categoryShowcaseCategoryIds ?? []}
          options={categories}
          onChange={(ids) => onChange({ categoryShowcaseCategoryIds: ids })}
        />
      </>
    );
  }

  if (panel === "features") {
    const items: {
      n: 1 | 2 | 3;
      title: keyof SiteEditorSettings;
      body: keyof SiteEditorSettings;
      iconKind: keyof SiteEditorSettings;
      icon: keyof SiteEditorSettings;
      image: keyof SiteEditorSettings;
    }[] = [
      { n: 1, title: "feature1Title", body: "feature1", iconKind: "feature1IconKind", icon: "feature1Icon", image: "feature1Image" },
      { n: 2, title: "feature2Title", body: "feature2", iconKind: "feature2IconKind", icon: "feature2Icon", image: "feature2Image" },
      { n: 3, title: "feature3Title", body: "feature3", iconKind: "feature3IconKind", icon: "feature3Icon", image: "feature3Image" },
    ];

    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.featuresTitle}
            onChange={(v) => onChange({ featuresTitle: v })}
          />
        </EditorField>
        {items.map(({ n, title, body, iconKind, icon, image }) => {
          const kind = (settings[iconKind] as "icon" | "image" | undefined) ?? "icon";
          return (
            <div key={n} className="flex flex-col gap-3 border-t border-border/70 dark:border-transparent pt-4 first:border-t-0 first:pt-0">
              <EditorField label={`Feature ${n} — title`}>
                <EditorInput
                  value={settings[title] as string}
                  onChange={(v) => onChange({ [title]: v } as Partial<SiteEditorSettings>)}
                />
              </EditorField>
              <EditorField label={`Feature ${n} — body`}>
                <EditorInput
                  value={settings[body] as string}
                  onChange={(v) => onChange({ [body]: v } as Partial<SiteEditorSettings>)}
                />
              </EditorField>
              <EditorField label={`Feature ${n} — icon or image`}>
                <SegmentedControl
                  value={kind}
                  options={[
                    { value: "icon", label: "Icon" },
                    { value: "image", label: "Image" },
                  ]}
                  onChange={(v) => onChange({ [iconKind]: v } as Partial<SiteEditorSettings>)}
                />
              </EditorField>
              {/* Reserved height so Icon ↔ Image swap doesn't shove the
               * next feature's fields — same fix as the Brand panel's
               * Text ↔ Image logo toggle. */}
              <div className="min-h-[5.25rem]">
                {kind === "image" ? (
                  <SingleImagePicker
                    label={`Feature ${n} image`}
                    siteId={siteId}
                    previewUrl={previewUrl}
                    value={(settings[image] as string) ?? ""}
                    onChange={(v) => onChange({ [image]: v } as Partial<SiteEditorSettings>)}
                    category="other"
                    frame="banner"
                  />
                ) : (
                  <IconPicker
                    value={(settings[icon] as string) || null}
                    onChange={(v) => onChange({ [icon]: v } as Partial<SiteEditorSettings>)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (panel === "testimonials") {
    return (
      <TestimonialsEditor
        siteId={siteId}
        mode={settings.testimonialsMode}
        title={settings.testimonialsTitle}
        items={
          settings.testimonialsMode === "images"
            ? settings.testimonialsScreenshots
            : settings.testimonialsCards
        }
        onModeChange={(testimonialsMode) =>
          onChange({
            testimonialsMode,
            // `testimonials` is the only field the storefront reads — keep it
            // pointed at whichever list is now active.
            testimonials:
              testimonialsMode === "images"
                ? settings.testimonialsScreenshots
                : settings.testimonialsCards,
          })
        }
        onTitleChange={(v) => onChange({ testimonialsTitle: v })}
        onChange={(items) =>
          onChange(
            settings.testimonialsMode === "images"
              ? { testimonialsScreenshots: items, testimonials: items }
              : { testimonialsCards: items, testimonials: items },
          )
        }
      />
    );
  }

  if (panel === "bannerCta") {
    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.ctaTitle}
            onChange={(v) => onChange({ ctaTitle: v })}
          />
        </EditorField>
        <EditorField label="Body">
          <EditorInput
            value={settings.ctaBody}
            onChange={(v) => onChange({ ctaBody: v })}
          />
        </EditorField>
        <EditorField label="Button">
          <EditorInput
            value={settings.ctaButton}
            onChange={(v) => onChange({ ctaButton: v })}
          />
        </EditorField>
      </>
    );
  }

  if (panel === "footer") {
    return (
      <>
        <EditorField label="Description">
          <EditorInput
            value={settings.footerDescription}
            onChange={(v) => onChange({ footerDescription: v })}
          />
        </EditorField>

        <EditorField label="Column 1 label">
          <EditorInput
            value={settings.footerShopLabel}
            onChange={(v) => onChange({ footerShopLabel: v })}
          />
        </EditorField>
        <NavLinkListEditor
          title="Column 1 links"
          links={settings.footerShopLinks}
          onChange={(footerShopLinks) => onChange({ footerShopLinks })}
        />

        <EditorField label="Column 2 label">
          <EditorInput
            value={settings.footerCompanyLabel}
            onChange={(v) => onChange({ footerCompanyLabel: v })}
          />
        </EditorField>
        <NavLinkListEditor
          title="Column 2 links"
          links={settings.footerCompanyLinks}
          onChange={(footerCompanyLinks) => onChange({ footerCompanyLinks })}
        />

        <p className="text-[11px] leading-relaxed text-slate-400">
          The newsletter signup is fixed and always shown.
        </p>
      </>
    );
  }

  return null;
}

function PageContentFields({
  type,
  settings,
  onChange,
  categories,
  products,
}: {
  type: SitePageType;
  settings: SiteEditorSettings;
  onChange: (p: Partial<SiteEditorSettings>) => void;
  categories: PickerCategory[];
  products: PickerProduct[];
}) {
  if (type === "products") {
    return (
      <>
        <EditorField label="Listing title">
          <EditorInput
            value={settings.featureProductsTitle}
            onChange={(v) => onChange({ featureProductsTitle: v })}
          />
        </EditorField>
        <ProductPicker
          selectedIds={settings.selectedProductIds}
          options={products}
          onChange={(ids) => onChange({ selectedProductIds: ids })}
          label="Products to preview"
        />
      </>
    );
  }

  if (type === "productDetail") {
    // Product copy lives on the product record itself, not the theme — this
    // panel only chooses which product the preview renders.
    return (
      <ProductSinglePicker
        value={settings.showcaseProductId}
        options={products}
        onChange={(id) => onChange({ showcaseProductId: id })}
      />
    );
  }

  if (type === "categories") {
    return (
      <>
        <EditorField label="Title">
          <EditorInput
            value={settings.categoriesTitle}
            onChange={(v) => onChange({ categoriesTitle: v })}
          />
        </EditorField>
        <CategoryPicker
          selectedIds={settings.selectedCategoryIds}
          options={categories}
          onChange={(ids) => onChange({ selectedCategoryIds: ids })}
        />
      </>
    );
  }

  if (type === "cart" || type === "checkout") {
    return (
      <ProductPicker
        selectedIds={settings.selectedProductIds}
        options={products}
        onChange={(ids) => onChange({ selectedProductIds: ids })}
        label="Sample cart products"
      />
    );
  }

  return (
    <EditorField label="Page heading">
      <EditorInput
        value={settings.tagline}
        onChange={(v) => onChange({ tagline: v })}
      />
    </EditorField>
  );
}
