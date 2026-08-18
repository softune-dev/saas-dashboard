"use client";

import { Check, ChevronDown, Pipette, Search, Shuffle, X } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import type { ColorPalette, FontPair } from "./editor-types";
import { fontFamilyFor } from "./editor-types";
import { ICON_NAMES } from "@/lib/icon-options";
import { GOOGLE_FONTS, ensureGoogleFont, randomFontPair } from "@/lib/google-fonts";

/** fontFamilyFor only knows the curated slugs; anything else picked from
 * the full-library search is a literal Google Font family name — preview
 * that directly, loading it on demand so the "Aa" glyph isn't blank. */
function previewFontFamily(kind: "display" | "body", value: string): string {
  const curated = fontFamilyFor(kind, value);
  if (curated) return curated;
  ensureGoogleFont(value);
  return `"${value}", ${kind === "display" ? "serif" : "sans-serif"}`;
}

export function EditorLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-wide text-slate-500">
      {children}
    </span>
  );
}

export function EditorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-lg border border-slate-200 bg-search-bg/60 px-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-white"
    />
  );
}

export function EditorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <EditorLabel>{label}</EditorLabel>
      {children}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  /** Optional fontFamily styles each label in that face (font pickers). */
  options: { value: T; label: string; fontFamily?: string }[];
  onChange: (v: T) => void;
}) {
  const layoutId = useId();

  return (
    <div className="relative flex gap-1 rounded-lg bg-search-bg p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "relative z-10 flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
              active
                ? "text-white"
                : "text-slate-500 hover:text-foreground",
            ].join(" ")}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-primary"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                  mass: 0.7,
                }}
              />
            ) : null}
            <span
              className="relative z-10"
              style={opt.fontFamily ? { fontFamily: opt.fontFamily } : undefined}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const FONT_PAGE_SIZE = 40;

/** Full Google Fonts search modal for Heading/Body — same pattern as
 * IconPicker: a native <select> can't preview 150+ typefaces and a button
 * grid doesn't scale past a dozen, so this opens a centered modal with
 * search + a scrollable list, each row rendered live in its own face via
 * ensureGoogleFont() (loaded on demand, only for rows actually on screen).
 * `options` is the small curated/next/font-preloaded set (fast, no-FOUC on
 * the storefront) — shown first, pinned, so the common choices stay one
 * click away without typing. */
export function FontPicker<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; fontFamily?: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const activeCurated = options.find((opt) => opt.value === value);
  const activeLabel = activeCurated?.label ?? value;
  useEffect(() => {
    if (!activeCurated) ensureGoogleFont(value);
  }, [value, activeCurated]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? GOOGLE_FONTS.filter((n) => n.toLowerCase().includes(q)) : GOOGLE_FONTS;
  }, [query]);
  const results = matches.slice(0, page * FONT_PAGE_SIZE);
  const hasMore = results.length < matches.length;

  useEffect(() => {
    setPage(1);
  }, [query]);

  // Preload every font row actually rendered on this page — cheap since
  // ensureGoogleFont dedupes and each is a tiny cached <link>.
  useEffect(() => {
    if (!open) return;
    results.forEach((name) => ensureGoogleFont(name, "400;600"));
  }, [open, results]);

  const closeModal = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-search-bg/60 px-2.5 py-2 text-left text-[13px] text-slate-700 transition-colors hover:border-slate-300"
        style={{ fontFamily: activeCurated?.fontFamily ?? `"${value}", sans-serif` }}
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/35"
              onClick={closeModal}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-[75vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h3 className="shrink-0 text-[13px] font-semibold text-foreground">Choose a font</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeModal}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
              <div className="relative shrink-0 border-b border-slate-100 px-4 py-2.5">
                <Search className="pointer-events-none absolute left-6.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${GOOGLE_FONTS.length}+ fonts…`}
                  className="w-full rounded-lg border border-slate-200 bg-search-bg/60 py-1.5 pr-3 pl-7 text-[13px] text-slate-700 outline-none focus:border-primary"
                />
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1.5">
                {results.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-slate-400">
                    No fonts match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  results.map((name) => {
                    const isActive = name === value || name === activeLabel;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          onChange(name as T);
                          closeModal();
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "hover:bg-search-bg",
                        ].join(" ")}
                      >
                        <span
                          className="truncate text-[15px] text-foreground"
                          style={{ fontFamily: `"${name}", sans-serif` }}
                        >
                          {name}
                        </span>
                        {isActive ? <Check className="size-4 shrink-0 text-primary" strokeWidth={2.5} /> : null}
                      </button>
                    );
                  })
                )}
              </div>
              {hasMore ? (
                <div className="shrink-0 border-t border-slate-100 p-2.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="w-full rounded-lg py-1.5 text-center text-[12px] font-medium text-primary transition-colors hover:bg-search-bg"
                  >
                    Load more ({matches.length - results.length} left) — or keep typing to narrow it down
                  </button>
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Curated headings+body combinations, shown the same way color palettes
 * are: pick a pair in one click, or fall through to "Custom" once the two
 * fields don't match any preset (e.g. picked separately below). */
export function FontPairGrid({
  pairs,
  current,
  onApply,
}: {
  pairs: FontPair[];
  current: { displayFont: string; bodyFont: string };
  onApply: (patch: { displayFont: string; bodyFont: string }) => void;
}) {
  const activePreset = pairs.find(
    (p) => p.displayFont === current.displayFont && p.bodyFont === current.bodyFont,
  );
  const isCustom = !activePreset;

  return (
    <div className="grid grid-cols-2 gap-2">
      {pairs.map((p) => {
        const active = activePreset?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onApply({ displayFont: p.displayFont, bodyFont: p.bodyFont })}
            className={[
              "relative flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-colors",
              active
                ? "border-primary bg-primary/5"
                : "border-slate-200 bg-search-bg/60 hover:border-slate-300",
            ].join(" ")}
          >
            {active ? (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            ) : null}
            <span
              className="text-base leading-none text-foreground"
              style={{ fontFamily: previewFontFamily("display", p.displayFont) }}
            >
              Aa
            </span>
            <span
              className="text-[11px] font-medium text-slate-500"
              style={{ fontFamily: previewFontFamily("body", p.bodyFont) }}
            >
              {p.name}
            </span>
          </button>
        );
      })}

      {/* Custom — active whenever Headings/Body don't match any pair above,
       * since picking them independently below IS the custom state. */}
      <div
        className={[
          "flex flex-col items-start gap-0.5 rounded-xl border p-2.5",
          isCustom ? "border-primary bg-primary/5" : "border-dashed border-slate-300",
        ].join(" ")}
      >
        <span
          className="text-base leading-none text-foreground"
          style={{ fontFamily: previewFontFamily("display", current.displayFont) }}
        >
          Aa
        </span>
        <span className="text-[11px] font-medium text-slate-500">Custom</span>
      </div>

      {/* Randomize — a fresh, tasteful pair pulled from the curated
       * "good for headings" / "good for body" subsets of the full library,
       * not just these six presets. Same idea as the Colors panel's dice. */}
      <button
        type="button"
        onClick={() => onApply(randomFontPair())}
        className="flex flex-col items-start justify-center gap-0.5 rounded-xl border border-dashed border-slate-300 p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Shuffle className="size-4 text-slate-500" strokeWidth={1.75} />
        <span className="text-[11px] font-medium text-slate-500">Randomize</span>
      </button>
    </div>
  );
}

/** Icons rendered per page — the full library is 2000+; rendering all of
 * them at once (even as lazy DynamicIcons) makes the grid sluggish to
 * scroll. Search narrows it, and "Load more" pages through the rest, so
 * nothing in the library is actually unreachable. */
const ICON_PAGE_SIZE = 120;

/** Icon-only picker backed by lucide's full ~2000-icon library (via
 * lucide-react/dynamic — each icon is its own dynamic import, so browsing
 * the whole set costs nothing until one is actually rendered), with search.
 * A native <select> here opens wherever the browser feels like (frequently
 * pinned to the top of the viewport in a scrolled sidebar), so this is a
 * fixed trigger button that opens a real centered modal with a search box
 * and an icon-only grid — no labels in the grid, just glyphs; hover shows
 * the name. */
export function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const activeName = (value as IconName) || ICON_NAMES[0];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ICON_NAMES.filter((n) => n.includes(q)) : ICON_NAMES;
  }, [query]);
  const results = matches.slice(0, page * ICON_PAGE_SIZE);
  const hasMore = results.length < matches.length;

  // Typing a new search always starts back at page 1 of the new result set.
  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <>
      {/* Same footprint as SingleImagePicker's "banner" frame (h-16) so
       * swapping Icon ↔ Image never changes the reserved space below it. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-search-bg/60 text-slate-600 transition-colors hover:border-slate-300 hover:text-foreground"
      >
        <DynamicIcon name={activeName} className="size-6" strokeWidth={1.5} />
        <span className="text-[13px] font-medium">{activeName.replace(/-/g, " ")}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/35"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-[75vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h3 className="shrink-0 text-[13px] font-semibold text-foreground">Choose an icon</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
              <div className="relative shrink-0 border-b border-slate-100 px-4 py-2.5">
                <Search className="pointer-events-none absolute left-6.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 2000+ icons…"
                  className="w-full rounded-lg border border-slate-200 bg-search-bg/60 py-1.5 pr-3 pl-7 text-[13px] text-slate-700 outline-none focus:border-primary"
                />
              </div>
              <div className="scrollbar-thin grid min-h-0 flex-1 grid-cols-7 content-start gap-1.5 overflow-y-auto p-3">
                {results.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-[13px] text-slate-400">
                    No icons match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  results.map((name) => {
                    const isActive = name === activeName;
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name.replace(/-/g, " ")}
                        aria-label={name.replace(/-/g, " ")}
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                          setQuery("");
                        }}
                        className={[
                          "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 bg-search-bg/60 text-slate-500 hover:border-slate-300 hover:text-foreground",
                        ].join(" ")}
                      >
                        <DynamicIcon name={name} className="size-4" strokeWidth={1.75} />
                      </button>
                    );
                  })
                )}
              </div>
              {hasMore ? (
                <div className="shrink-0 border-t border-slate-100 p-2.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="w-full rounded-lg py-1.5 text-center text-[12px] font-medium text-primary transition-colors hover:bg-search-bg"
                  >
                    Load more ({matches.length - results.length} left) — or keep typing to narrow it down
                  </button>
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function normalizeHex(input: string): string | null {
  let raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    raw = raw
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toUpperCase()}`;
}

function toColorInputValue(hex: string): string {
  return normalizeHex(hex) ?? "#000000";
}

/** True when hex is light enough that a dark checkmark reads better. */
function isLightHex(hex: string): boolean {
  const n = normalizeHex(hex);
  if (!n) return true;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  // Relative luminance (sRGB, approximate)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/**
 * Preset dots + one custom chip. The custom chip is the only place a non-preset
 * color appears — never a second history circle next to the picker (that used
 * to show the same selection twice).
 */
export function ColorSwatches({
  value,
  swatches,
  onChange,
  size = "sm",
  tone = "light",
}: {
  value: string;
  swatches: string[];
  onChange: (v: string) => void;
  /** sm = compact dots, lg = spacious grid for the colors panel */
  size?: "sm" | "lg";
  /** Container tone — affects borders on dark ColorRoleCards */
  tone?: "light" | "dark";
}) {
  const isLg = size === "lg";
  const presets = swatches.slice(0, 8);
  const isCustom = !presets.some((s) => hexEq(s, value));
  const dark = tone === "dark";

  const dotSize = isLg ? "size-9" : "size-7";
  const insetRing = dark
    ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
    : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((color) => {
        const active = hexEq(value, color);
        const light = isLightHex(color);
        return (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={active}
            title={color}
            onClick={() => onChange(color)}
            className={[
              "relative shrink-0 rounded-full transition-[transform,box-shadow] duration-150",
              dotSize,
              insetRing,
              active
                ? "z-[1] scale-105 ring-2 ring-primary ring-offset-2"
                : isLg
                  ? "hover:scale-105"
                  : "hover:opacity-90",
              active && dark ? "ring-offset-[#2A2A2A]" : "",
              active && !dark ? "ring-offset-search-bg" : "",
            ].join(" ")}
            style={{ backgroundColor: color }}
          >
            {active ? (
              <Check
                className={[
                  "absolute inset-0 m-auto",
                  isLg ? "size-3.5" : "size-3",
                  light ? "text-slate-900" : "text-white",
                ].join(" ")}
                strokeWidth={3}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}

      {/* Single custom control: fill = current custom color when active;
       * otherwise a neutral “pick any” chip. Never duplicates as a second
       * history swatch. */}
      <label
        aria-label={
          isCustom ? `Custom color ${value}` : "Pick a custom color"
        }
        title={isCustom ? value : "Custom color"}
        className={[
          "relative shrink-0 cursor-pointer overflow-hidden rounded-full transition-[transform,box-shadow] duration-150",
          dotSize,
          isCustom
            ? [
                insetRing,
                "scale-105 ring-2 ring-primary ring-offset-2",
                dark ? "ring-offset-[#2A2A2A]" : "ring-offset-search-bg",
              ].join(" ")
            : dark
              ? "border border-dashed border-white/30 bg-white/10 hover:bg-white/15"
              : "border border-dashed border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
        ].join(" ")}
        style={isCustom ? { backgroundColor: value } : undefined}
      >
        {isCustom ? (
          <Check
            className={[
              "pointer-events-none absolute inset-0 m-auto",
              isLg ? "size-3.5" : "size-3",
              isLightHex(value) ? "text-slate-900" : "text-white",
            ].join(" ")}
            strokeWidth={3}
            aria-hidden
          />
        ) : (
          <Pipette
            className={[
              "pointer-events-none absolute inset-0 m-auto",
              isLg ? "size-3.5" : "size-3",
              dark ? "text-white/60" : "text-slate-400",
            ].join(" ")}
            strokeWidth={2}
            aria-hidden
          />
        )}
        <input
          type="color"
          value={toColorInputValue(isCustom ? value : "#6366F1")}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          // Fully out of layout so the browser never paints a second chip
          // under the label (the old opacity-0 inset input looked like a
          // duplicate circle of the same color).
          className="sr-only"
        />
      </label>
    </div>
  );
}

function hexEq(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`.toUpperCase();
}

/** Generates one cohesive, tasteful palette rather than three independent
 * random hexes — shares a hue across roles (like colorPalettes' hand-picked
 * presets) and only occasionally flips to a dark surface, since that also
 * has to flip which end of the lightness scale the text color sits on. */
export function randomPalette(): Pick<
  ColorPalette,
  "primaryColor" | "accentColor" | "surfaceColor"
> {
  const hue = Math.floor(Math.random() * 360);
  const surfaceIsDark = Math.random() < 0.2;
  return {
    primaryColor: hslToHex(hue, 40 + Math.random() * 25, 16 + Math.random() * 12),
    surfaceColor: surfaceIsDark
      ? hslToHex(hue, 20 + Math.random() * 10, 12 + Math.random() * 4)
      : hslToHex(hue, 15 + Math.random() * 10, 95 + Math.random() * 2),
    accentColor: surfaceIsDark
      ? hslToHex(hue, 12 + Math.random() * 8, 92 + Math.random() * 4)
      : hslToHex(hue, 12 + Math.random() * 8, 13 + Math.random() * 5),
  };
}

/** Palette picker for the Colors panel — presets + a live "Custom" card that
 * mirrors whatever the three role pickers below are currently set to, plus a
 * dice card that randomizes into that same custom state. Selecting a preset
 * still just calls onApply with a patch; the ColorRoleCards below remain the
 * source of truth and can override any single role afterward. */
export function PaletteGrid({
  palettes,
  current,
  onApply,
}: {
  palettes: ColorPalette[];
  current: { primaryColor: string; accentColor: string; surfaceColor: string };
  onApply: (patch: {
    primaryColor: string;
    accentColor: string;
    surfaceColor: string;
  }) => void;
}) {
  const activePreset = palettes.find(
    (p) =>
      hexEq(p.primaryColor, current.primaryColor) &&
      hexEq(p.accentColor, current.accentColor) &&
      hexEq(p.surfaceColor, current.surfaceColor),
  );
  const isCustom = !activePreset;

  const swatchDots = (p: { primaryColor: string; accentColor: string; surfaceColor: string }) => (
    <div className="flex -space-x-1.5">
      {[p.surfaceColor, p.primaryColor, p.accentColor].map((c, i) => (
        <span
          key={i}
          className="size-5 rounded-full ring-2 ring-white"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {palettes.map((p) => {
        const active = activePreset?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onApply({
                primaryColor: p.primaryColor,
                accentColor: p.accentColor,
                surfaceColor: p.surfaceColor,
              })
            }
            className={[
              "flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
              active
                ? "border-primary bg-primary/5"
                : "border-slate-200 bg-search-bg/60 hover:border-slate-300",
            ].join(" ")}
          >
            <div className="relative">
              {swatchDots(p)}
              {active ? (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </div>
            <span className="text-[11px] font-medium text-foreground">{p.name}</span>
          </button>
        );
      })}

      {/* Custom — always mirrors the live colors below; "active" whenever
       * they don't match any preset, since that IS the custom state. */}
      <div
        className={[
          "flex flex-col items-center gap-2 rounded-xl border p-3",
          isCustom ? "border-primary bg-primary/5" : "border-dashed border-slate-300",
        ].join(" ")}
      >
        <div className="relative">
          {swatchDots(current)}
          {isCustom ? (
            <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-white">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          ) : null}
        </div>
        <span className="text-[11px] font-medium text-foreground">Custom</span>
      </div>

      {/* Random — doesn't hold its own colors; generates a new palette and
       * applies it straight into the Custom slot above. */}
      <button
        type="button"
        onClick={() => onApply(randomPalette())}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-search-bg/60 p-3 transition-colors hover:border-slate-400 hover:bg-search-bg"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-white text-foreground ring-1 ring-inset ring-black/10">
          <Shuffle className="size-4" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-medium text-foreground">Random</span>
      </button>
    </div>
  );
}

/** Color role card used in the Colors panel */
export function ColorRoleCard({
  label,
  description,
  value,
  swatches,
  onChange,
  tone = "light",
}: {
  label: string;
  description?: string;
  value: string;
  swatches: string[];
  onChange: (v: string) => void;
  /** dark = better contrast for light surface swatches */
  tone?: "light" | "dark";
}) {
  const darkTone = tone === "dark";
  const [draft, setDraft] = useState(value);
  const hexInputId = useId();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitHex = (raw: string) => {
    const next = normalizeHex(raw);
    if (next) {
      onChange(next);
      setDraft(next);
    } else {
      setDraft(value);
    }
  };

  return (
    <div
      className={[
        "flex flex-col gap-3.5 rounded-2xl p-4",
        darkTone ? "bg-[#2A2A2A]" : "bg-search-bg",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={[
              "text-sm font-semibold",
              darkTone ? "text-white" : "text-foreground",
            ].join(" ")}
          >
            {label}
          </p>
          {description ? (
            <p
              className={[
                "mt-0.5 text-[11px] leading-snug",
                darkTone ? "text-white/50" : "text-slate-500",
              ].join(" ")}
            >
              {description}
            </p>
          ) : null}
        </div>
        {/* Live swatch + hex as one control — hex is editable, swatch is preview */}
        <div
          className={[
            "flex shrink-0 items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-1",
            darkTone
              ? "bg-white/10 ring-1 ring-white/10"
              : "bg-white ring-1 ring-slate-200/80",
          ].join(" ")}
        >
          <span
            className={[
              "size-6 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
            ].join(" ")}
            style={{ backgroundColor: normalizeHex(value) ?? value }}
            aria-hidden
          />
          <input
            id={hexInputId}
            type="text"
            value={draft}
            spellCheck={false}
            aria-label={`${label} color code`}
            onChange={(e) => {
              const next = e.target.value;
              setDraft(next);
              const parsed = normalizeHex(next);
              if (parsed) onChange(parsed);
            }}
            onBlur={() => commitHex(draft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className={[
              "w-[4.75rem] bg-transparent text-center font-mono text-[11px] font-medium uppercase tracking-wide outline-none",
              darkTone ? "text-white/90" : "text-slate-600",
            ].join(" ")}
          />
        </div>
      </div>

      <ColorSwatches
        value={value}
        swatches={swatches}
        onChange={onChange}
        size="lg"
        tone={tone}
      />
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <EditorLabel>{label}</EditorLabel>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
