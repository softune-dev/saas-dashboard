"use client";

import { ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Category as PickerCategory } from "@/components/categories/categories-data";
import type { Product as PickerProduct } from "@/components/products/products-data";
import { MaskIcon } from "@/components/ui/mask-icon";
import { AISuggestBox } from "./ai-suggest-box";
import {
  ColorRoleCard,
  EditorField,
  EditorInput,
  FontPairGrid,
  FontPicker,
  PaletteGrid,
  SegmentedControl,
} from "./editor-field";
import {
  bodyFontOptions,
  displayFontOptions,
  fontPairs,
  pageSupportsSections,
  primarySwatches,
  surfaceSwatches,
  textSwatches,
  type ColorPalette,
  type SectionType,
  type SiteEditorSettings,
  type SitePage,
} from "./editor-types";
import { HeroImagePicker, SingleImagePicker } from "./hero-image-picker";
import { NavLinkListEditor } from "./nav-link-list-editor";
import { SectionsSortableList } from "./sections-sortable-list";

type AccordionGroupId = "brand" | "typography" | "colors" | "header" | "sections";

/** Brand, Colors, and Header used to be three separate rail-selected panels
 * — clicking each icon fully replaced the panel content. Merged into one
 * scrollable accordion so switching between them (and seeing the Landing
 * Sections list right below) doesn't require losing your place. Only one
 * group is open at a time — accordion semantics, not independent toggles,
 * so the whole thing stays scannable on small screens instead of turning
 * into three fully-expanded panels stacked forever. */
export function BrandColorsHeaderPanel({
  initialGroup,
  settings,
  siteId,
  themePalettes,
  previewUrl,
  activePageId,
  onChange,
  availableToAdd,
  onAddSection,
  onRemoveSection,
  onReorderSections,
  onActivePageChange,
}: {
  initialGroup: AccordionGroupId | null;
  settings: SiteEditorSettings;
  siteId: string | null;
  themePalettes: ColorPalette[];
  previewUrl?: string;
  activePageId: string;
  onChange: (patch: Partial<SiteEditorSettings>) => void;
  availableToAdd: { type: SectionType; label: string }[];
  onAddSection: (type: SectionType) => void;
  onRemoveSection: (id: string) => void;
  onReorderSections: (sections: SiteEditorSettings["sections"]) => void;
  onActivePageChange: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<AccordionGroupId | null>(initialGroup ?? "brand");
  const toggle = (id: AccordionGroupId) =>
    setExpanded((cur) => (cur === id ? null : id));

  const activePage =
    settings.pages.find((p: SitePage) => p.id === activePageId) ?? settings.pages[0];
  const canEditSections = activePage ? pageSupportsSections(activePage.type) : false;

  return (
    <div className="flex flex-col gap-3">
      <AccordionGroup
        label="Brand"
        icon="/sidebar/brand.svg"
        expanded={expanded === "brand"}
        onToggle={() => toggle("brand")}
      >
        <BrandFields settings={settings} siteId={siteId} previewUrl={previewUrl} onChange={onChange} />
      </AccordionGroup>

      <AccordionGroup
        label="Typography"
        icon="/sidebar/note.svg"
        expanded={expanded === "typography"}
        onToggle={() => toggle("typography")}
      >
        <TypographyFields settings={settings} siteId={siteId} onChange={onChange} />
      </AccordionGroup>

      <AccordionGroup
        label="Colors"
        icon="/sidebar/color.svg"
        expanded={expanded === "colors"}
        onToggle={() => toggle("colors")}
      >
        <ColorsFields
          settings={settings}
          siteId={siteId}
          themePalettes={themePalettes}
          onChange={onChange}
        />
      </AccordionGroup>

      <AccordionGroup
        label="Header"
        icon="/sidebar/header.svg"
        expanded={expanded === "header"}
        onToggle={() => toggle("header")}
      >
        <HeaderFields settings={settings} onChange={onChange} />
      </AccordionGroup>

      <AccordionGroup
        label="Landing Sections"
        icon="/sidebar/sections.svg"
        expanded={expanded === "sections"}
        onToggle={() => toggle("sections")}
      >
        {!canEditSections ? (
          <p className="text-sm text-muted">Sections only apply to the Home page.</p>
        ) : (
          <>
            <p className="text-[11px] text-muted-soft">Drag to reorder</p>
            <div data-tour="editor-sections-list">
              <SectionsSortableList
                sections={settings.sections}
                onReorder={onReorderSections}
                onRemove={onRemoveSection}
              />
            </div>
            {availableToAdd.length > 0 ? (
              <div
                data-tour="editor-add-section"
                className="flex flex-col gap-2 border-t border-border dark:border-transparent pt-3"
              >
                <p className="text-[11px] font-medium text-muted">Add section</p>
                <div className="flex flex-col gap-1.5">
                  {availableToAdd.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => onAddSection(item.type)}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <Plus className="size-4 text-primary" strokeWidth={1.75} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">All sections added</p>
            )}
          </>
        )}
      </AccordionGroup>
    </div>
  );
}

/** Header row + collapsible body. Collapsed shows only the label and an
 * arrow — no field content, no AI box, nothing — per the brief. */
function AccordionGroup({
  label,
  icon,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border dark:border-transparent dark:bg-search-bg/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-search-bg"
      >
        <span className="inline-flex items-center gap-2">
          <MaskIcon src={icon} className="size-4 text-muted" />
          {label}
        </span>
        <ChevronDown
          className={["size-4 text-muted transition-transform", expanded ? "rotate-180" : ""].join(" ")}
          strokeWidth={2}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t border-border dark:border-transparent p-3">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Same collapse pattern as AccordionGroup, one level down — used for "Ask
 * AI" inside Brand/Colors so it doesn't eat space by default. Compact
 * variant: smaller text, icon instead of a full header row. */
function AskAiCollapsible({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-semibold text-foreground transition-colors hover:bg-search-bg"
      >
        <span className="inline-flex items-center gap-1.5">
          <img src="/sidebar/gemini.svg" alt="" className="size-3.5 shrink-0" />
          Ask AI
        </span>
        <ChevronDown
          className={["size-3.5 text-muted transition-transform", open ? "rotate-180" : ""].join(" ")}
          strokeWidth={2}
        />
      </button>
      {open ? <div className="border-t border-border dark:border-transparent p-2.5">{children}</div> : null}
    </div>
  );
}

function BrandFields({
  settings,
  siteId,
  previewUrl,
  onChange,
}: {
  settings: SiteEditorSettings;
  siteId: string | null;
  previewUrl?: string;
  onChange: (patch: Partial<SiteEditorSettings>) => void;
}) {
  const logoType = settings.logoType ?? "text";
  return (
    <>
      <AskAiCollapsible>
        <AISuggestBox siteId={siteId} onApply={onChange} hideHeader />
      </AskAiCollapsible>
      <EditorField label="Logo">
        <SegmentedControl
          value={logoType}
          options={[
            { value: "image", label: "Image" },
            { value: "text", label: "Text" },
          ]}
          onChange={(v) => onChange({ logoType: v })}
        />
      </EditorField>
      <div className="min-h-[5.25rem]">
        {logoType === "text" ? (
          <EditorField label="Site name">
            <EditorInput value={settings.siteName} onChange={(v) => onChange({ siteName: v })} />
          </EditorField>
        ) : (
          <SingleImagePicker
            label="Logo image"
            siteId={siteId}
            previewUrl={previewUrl}
            value={settings.logoImage ?? ""}
            onChange={(v) => onChange({ logoImage: v })}
            category="other"
            frame="banner"
            whiteInDark
          />
        )}
      </div>
      <EditorField label="Tagline">
        <EditorInput value={settings.tagline} onChange={(v) => onChange({ tagline: v })} />
      </EditorField>
      <EditorField label="Buttons">
        <SegmentedControl
          value={settings.buttonStyle}
          options={[
            { value: "Pill", label: "Pill" },
            { value: "Rounded", label: "Round" },
            { value: "Square", label: "Square" },
          ]}
          onChange={(v) => onChange({ buttonStyle: v })}
        />
      </EditorField>
    </>
  );
}

function TypographyFields({
  settings,
  siteId,
  onChange,
}: {
  settings: SiteEditorSettings;
  siteId: string | null;
  onChange: (patch: Partial<SiteEditorSettings>) => void;
}) {
  return (
    <>
      <AskAiCollapsible>
        <AISuggestBox siteId={siteId} onApply={onChange} hideHeader />
      </AskAiCollapsible>
      <EditorField label="Font pairs">
        <FontPairGrid
          pairs={fontPairs}
          current={{ displayFont: settings.displayFont, bodyFont: settings.bodyFont }}
          onApply={(patch) => onChange(patch)}
        />
      </EditorField>
      <EditorField label="Headings">
        <FontPicker
          value={settings.displayFont}
          options={displayFontOptions}
          onChange={(v) => onChange({ displayFont: v })}
        />
      </EditorField>
      <EditorField label="Body text">
        <FontPicker
          value={settings.bodyFont}
          options={bodyFontOptions}
          onChange={(v) => onChange({ bodyFont: v })}
        />
      </EditorField>
    </>
  );
}

function ColorsFields({
  settings,
  siteId,
  themePalettes,
  onChange,
}: {
  settings: SiteEditorSettings;
  siteId: string | null;
  themePalettes: ColorPalette[];
  onChange: (patch: Partial<SiteEditorSettings>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <AskAiCollapsible>
        <AISuggestBox siteId={siteId} onApply={onChange} hideHeader />
      </AskAiCollapsible>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium text-muted">Palettes</p>
        <PaletteGrid
          palettes={themePalettes}
          current={{
            primaryColor: settings.primaryColor,
            accentColor: settings.accentColor,
            surfaceColor: settings.surfaceColor,
          }}
          onApply={(patch) => onChange(patch)}
        />
      </div>
      <ColorRoleCard
        label="Primary"
        value={settings.primaryColor}
        swatches={primarySwatches}
        onChange={(v) => onChange({ primaryColor: v })}
      />
      <ColorRoleCard
        label="Text"
        value={settings.accentColor}
        swatches={textSwatches}
        onChange={(v) => onChange({ accentColor: v })}
      />
      <ColorRoleCard
        label="Surface"
        value={settings.surfaceColor}
        swatches={surfaceSwatches}
        onChange={(v) => onChange({ surfaceColor: v })}
        tone="dark"
      />
    </div>
  );
}

function HeaderFields({
  settings,
  onChange,
}: {
  settings: SiteEditorSettings;
  onChange: (patch: Partial<SiteEditorSettings>) => void;
}) {
  return (
    <>
      <NavLinkListEditor
        title="Nav links"
        links={settings.navLinks}
        onChange={(navLinks) => onChange({ navLinks })}
        minCount={1}
      />
      <div className="flex flex-col gap-2 border-t border-border dark:border-transparent pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-muted">Buttons</p>
          <button
            type="button"
            onClick={() =>
              onChange({
                headerButtons: [
                  ...settings.headerButtons,
                  { id: `b-${Date.now()}`, label: "Button", style: "outline" },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {settings.headerButtons.map((btn) => (
            <li key={btn.id} className="flex flex-col gap-2 rounded-xl border border-border p-2.5">
              <div className="flex items-center gap-1.5">
                <EditorInput
                  value={btn.label}
                  onChange={(v) =>
                    onChange({
                      headerButtons: settings.headerButtons.map((b) =>
                        b.id === btn.id ? { ...b, label: v } : b,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label="Remove button"
                  onClick={() =>
                    onChange({
                      headerButtons: settings.headerButtons.filter((b) => b.id !== btn.id),
                    })
                  }
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-red-500"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
                </button>
              </div>
              <SegmentedControl
                value={btn.style}
                options={[
                  { value: "primary", label: "Primary" },
                  { value: "outline", label: "Outline" },
                ]}
                onChange={(v) =>
                  onChange({
                    headerButtons: settings.headerButtons.map((b) =>
                      b.id === btn.id ? { ...b, style: v } : b,
                    ),
                  })
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
