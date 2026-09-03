export type DeviceId = "desktop" | "tablet" | "mobile";

export type BrowserChromeTheme = "light" | "dark";

/** Theme editor sidebar sizing (rail + extension) */
/** Fixed tools rail width — collapsed sidebar must equal this exactly */
export const SIDEBAR_RAIL = 72;
export const SIDEBAR_MIN = 360;
export const SIDEBAR_MAX = 640;
export const SIDEBAR_DEFAULT = 420;

/** Global tools (always in the rail) */
export type GlobalPanelId =
  | "brand"
  | "colors"
  | "header"
  | "pages"
  | "sections"
  | "pageContent";

/** Storefront pages (routes) the merchant can manage */
export type SitePageType =
  | "home"
  | "products"
  | "productDetail"
  | "categories"
  | "cart"
  | "checkout"
  | "about"
  | "contact"
  | "faq"
  | "privacy"
  | "terms"
  | "notFound";

export type SitePage = {
  id: string;
  type: SitePageType;
  title: string;
  path: string;
  enabled: boolean;
};

/** Page sections the user can add / remove / edit */
export type SectionType =
  | "banner"
  | "hero"
  | "events"
  | "categories"
  | "featureProducts"
  | "productShowcase"
  | "categoryShowcase"
  | "whyChooseUs"
  | "features"
  | "testimonials"
  | "bannerCta"
  | "footer";

export type EditorPanelId = GlobalPanelId | SectionType;

export type PageSection = {
  id: string;
  type: SectionType;
};

export type NavLink = {
  id: string;
  label: string;
  /** Route this link points at, e.g. "/shop". Copy it from the preview's URL
   * bar — that bar shows the real running route for exactly this reason. */
  path: string;
};

export type HeaderButton = {
  id: string;
  label: string;
  style: "primary" | "outline";
};

/** Customer quote shown in the testimonials section */
export type EditorTestimonial = {
  id: string;
  name: string;
  quote: string;
  /** Optional client photo — empty falls back to placeholder */
  image: string;
};

export type SiteEditorSettings = {
  siteName: string;
  /** Text wordmark vs uploaded image — only one mode is active at a time. */
  logoType: "text" | "image";
  /** Cloudinary (or absolute) URL when logoType === "image". Empty falls back
   * to the text site name on the storefront so the header never goes blank. */
  logoImage: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  /** Keys into displayFontOptions / bodyFontOptions below — must match the
   * families actually loaded in templates/aurora/app/layout.tsx exactly, or
   * the storefront silently falls back to its own default. */
  displayFont: string;
  bodyFont: string;
  buttonStyle: "Pill" | "Rounded" | "Square";
  /** Header navigation links (user can add more) */
  navLinks: NavLink[];
  /** Header action buttons (user can add more) */
  headerButtons: HeaderButton[];
  /** Storefront pages / routes */
  pages: SitePage[];
  /** Ordered homepage sections */
  sections: PageSection[];
  // Banner marquee — segments joined by announcementDivider, then looped
  announcementItems: string[];
  announcementDivider: string;
  // Hero — images only, no text. 16:9 is the required set and is what desktop
  // always shows; 1:1 is an optional mobile-only set that falls back to the
  // 16:9 images when empty. More than one image in a set auto-slides.
  heroImages: string[];
  heroImagesSquare: string[];
  // Events — up to 3 sale/promo campaigns featured on the homepage, right
  // under Hero. No section heading (deliberately un-editable — the storefront
  // renders no title for this section at all). Explicitly curated, no
  // "empty selection = show all" fallback (unlike Categories below) — see
  // EventPicker's own comment.
  selectedEventIds: string[];
  // Categories — pick from dashboard categories by id
  categoriesTitle: string;
  selectedCategoryIds: string[];
  // Feature products — pick catalog products by id (any count)
  featureProductsTitle: string;
  selectedProductIds: string[];
  // Product showcase — one product from catalog (title/price/sizes come from
  // the product itself; free-text overlay fields were removed with the old hero layout)
  showcaseProductId: string;
  // Why choose us — each point is title + body (icons fixed per slot).
  // whyImage is upload-driven, like heroImages — empty renders an empty box
  // on the storefront rather than falling back to a bundled stock photo.
  whyTitle: string;
  whyImage: string;
  why1Title: string;
  why1: string;
  why2Title: string;
  why2: string;
  why3Title: string;
  why3: string;
  // Category showcase — products grouped by selected categories
  categoryShowcaseTitle: string;
  categoryShowcaseCategoryIds: string[];
  // Features — each item is title + body, same pattern as Why Choose Us,
  // plus a per-item icon-or-image (unlike Why Choose Us, whose icons are
  // fixed per slot). iconKind picks which of icon/image is actually used;
  // the unused field is kept around so switching back doesn't lose it.
  featuresTitle: string;
  feature1Title: string;
  feature1: string;
  feature1IconKind: "icon" | "image";
  feature1Icon: string;
  feature1Image: string;
  feature2Title: string;
  feature2: string;
  feature2IconKind: "icon" | "image";
  feature2Icon: string;
  feature2Image: string;
  feature3Title: string;
  feature3: string;
  feature3IconKind: "icon" | "image";
  feature3Icon: string;
  feature3Image: string;
  // Testimonials — "cards" shows name/quote/photo; "images" shows just the
  // uploaded screenshot (e.g. a WhatsApp/Messenger message from a real
  // customer) full-size, no name/quote fields collected. Cards and
  // screenshots are separate lists so switching mode never edits or clears
  // the other one; `testimonials` always mirrors whichever list is active
  // and is the only one the storefront/backend reads.
  testimonialsMode: "cards" | "images";
  testimonialsTitle: string;
  testimonials: EditorTestimonial[];
  testimonialsCards: EditorTestimonial[];
  testimonialsScreenshots: EditorTestimonial[];
  // Banner CTA
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  // Footer — Newsletter column is fixed (no editable fields) by design.
  footerDescription: string;
  footerShopLabel: string;
  footerShopLinks: NavLink[];
  footerCompanyLabel: string;
  footerCompanyLinks: NavLink[];
};

export const sectionCatalog: {
  type: SectionType;
  label: string;
}[] = [
  { type: "banner", label: "Banner" },
  { type: "hero", label: "Hero" },
  { type: "events", label: "Events" },
  { type: "categories", label: "Categories" },
  { type: "featureProducts", label: "Feature products" },
  { type: "productShowcase", label: "Product showcase" },
  { type: "categoryShowcase", label: "Category Showcase" },
  { type: "whyChooseUs", label: "Why choose us" },
  { type: "features", label: "Feature section" },
  { type: "testimonials", label: "Testimonials" },
  { type: "bannerCta", label: "Banner CTA" },
  { type: "footer", label: "Footer" },
];

/** Section types a given theme's own SectionRenderer.tsx has no rendering
 * for at all — a permanent no-op, not just an unfilled slot. "Add section"
 * must never offer these: adding one would put a section in the merchant's
 * list that visibly does nothing on the live site. Currently only bazaar's
 * "banner" (its hero already owns that promo-strip role — see
 * templates/bazaar/sections/SectionRenderer.tsx's own comment). Keyed by
 * themes-data id (the same key defaultSiteSettingsByTheme uses), not the
 * backend Template.key. */
export const unsupportedSectionsByTheme: Record<string, SectionType[]> = {
  bazaar: ["banner"],
};

/** Recommended top-to-bottom homepage section order */
export const defaultSectionOrder: PageSection[] = [
  { id: "s2", type: "hero" },
  { id: "s1", type: "banner" },
  { id: "s2b", type: "events" },
  { id: "s3", type: "categories" },
  { id: "s4", type: "featureProducts" },
  { id: "s5", type: "productShowcase" },
  { id: "s5b", type: "categoryShowcase" },
  { id: "s6", type: "whyChooseUs" },
  { id: "s7", type: "features" },
  { id: "s8", type: "testimonials" },
  { id: "s9", type: "bannerCta" },
  { id: "s10", type: "footer" },
];

export const pageCatalog: {
  type: SitePageType;
  title: string;
  path: string;
  /** Home supports section builder */
  hasSections: boolean;
  /**
   * Can open a page-content edit tool in the rail.
   * System pages (shop, cart, checkout, 404, …) are preview-only.
   */
  editable: boolean;
}[] = [
  {
    type: "home",
    title: "Home",
    path: "/",
    hasSections: true,
    editable: false,
  },
  {
    type: "products",
    title: "Shop",
    path: "/shop",
    hasSections: false,
    editable: false,
  },
  {
    type: "productDetail",
    title: "Product details",
    path: "/shop/:slug",
    hasSections: false,
    editable: false,
  },
  {
    type: "categories",
    title: "Categories",
    path: "/categories",
    hasSections: false,
    editable: false,
  },
  {
    type: "cart",
    title: "Cart",
    path: "/cart",
    hasSections: false,
    editable: false,
  },
  {
    type: "checkout",
    title: "Checkout",
    path: "/checkout",
    hasSections: false,
    editable: false,
  },
  {
    type: "about",
    title: "About",
    path: "/about",
    hasSections: false,
    editable: true,
  },
  {
    type: "contact",
    title: "Contact",
    path: "/contact",
    hasSections: false,
    editable: true,
  },
  {
    type: "faq",
    title: "FAQ",
    path: "/faq",
    hasSections: false,
    editable: true,
  },
  {
    type: "privacy",
    title: "Privacy",
    path: "/privacy",
    hasSections: false,
    editable: true,
  },
  {
    type: "terms",
    title: "Terms",
    path: "/terms",
    hasSections: false,
    editable: true,
  },
  {
    type: "notFound",
    title: "404",
    path: "/404",
    hasSections: false,
    editable: false,
  },
];

export const defaultPages: SitePage[] = pageCatalog.map((p, i) => ({
  id: `p${i + 1}`,
  type: p.type,
  title: p.title,
  path: p.path,
  enabled: true,
}));

// Per-template defaults live in editor-defaults.ts (import from there —
// do not re-export here; that creates a cycle: defaults need defaultPages
// from this file, and TDZ on defaultPages crashes at runtime).

export const deviceWidths: Record<DeviceId, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 390,
};

// All three swatch sets are pulled from the actual reference design
// (E:\Projects\Personal Projects\ecom — Aurora's original source) rather than
// invented: `src/routes/admin.tsx`'s own theme-color picker for primary, and
// the warm oklch(_, _, ~60-85) hue family in `src/styles.css` for text and
// surface. Generic saturated colors (bright orange/blue/purple) read as an
// off-the-shelf template; these are the same restrained, warm, editorial
// palette the storefront itself was designed around.

/** Buttons/accents. Every option is dark and desaturated on purpose — Aurora
 * is a quiet-luxury look, not a startup landing page. */
export const primarySwatches = [
  "#2C220F", // Espresso — the site's own default ink color
  "#1C1C1C", // Charcoal
  "#0F172A", // Midnight Navy
  "#14532D", // Forest Green
  "#7C2D12", // Rust
];

/** Body/heading text. Warm near-blacks and warm off-whites — matches the
 * site's own oklch hue (~60), not a cool blue-gray like Tailwind's slate. */
export const textSwatches = [
  "#221E19", // Ink — the site's own --ink token
  "#2C220F", // Espresso
  "#292524", // Warm charcoal
  "#57534E", // Warm gray
  "#F5F0E6", // Warm cream — for text on a dark surface
];

/** Page/button-contrast surface. THE most important role for this theme —
 * it sets the overall mood more than any other single choice. */
export const surfaceSwatches = [
  "#FAF9F6", // Paper — the site's actual default background
  "#EFEBE2", // Oat — the site's own --muted token
  "#D9CFBB", // Linen — a warmer, deeper sand
  "#FFFFFF", // White
  "#2C220F", // Espresso — a dark, moody storefront option
];

export type ColorPalette = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
};

// Must match the keys in templates/aurora/lib/theme-context.tsx's
// DISPLAY_FONTS / BODY_FONTS exactly — those are what the storefront
// actually has loaded via next/font. This isn't a free-text field because
// next/font requires each family to be statically imported ahead of time.
// fontFamily uses CSS vars from dashboard/app/layout.tsx's next/font loads
// so SegmentedControl can preview each face as itself.
export const displayFontOptions: {
  value: string;
  label: string;
  fontFamily?: string;
}[] = [
  {
    value: "fraunces",
    label: "Fraunces",
    fontFamily: "var(--font-preview-fraunces), serif",
  },
  {
    value: "playfair",
    label: "Playfair",
    fontFamily: "var(--font-preview-playfair), serif",
  },
  {
    value: "cormorant",
    label: "Cormorant",
    fontFamily: "var(--font-preview-cormorant), serif",
  },
  {
    value: "libre-baskerville",
    label: "Libre Baskerville",
    fontFamily: "var(--font-preview-libre-baskerville), serif",
  },
  {
    value: "dm-serif-display",
    label: "DM Serif Display",
    fontFamily: "var(--font-preview-dm-serif-display), serif",
  },
  {
    value: "spectral",
    label: "Spectral",
    fontFamily: "var(--font-preview-spectral), serif",
  },
  {
    value: "bodoni-moda",
    label: "Bodoni Moda",
    fontFamily: "var(--font-preview-bodoni-moda), serif",
  },
  {
    value: "newsreader",
    label: "Newsreader",
    fontFamily: "var(--font-preview-newsreader), serif",
  },
  {
    value: "instrument-serif",
    label: "Instrument Serif",
    fontFamily: "var(--font-preview-instrument-serif), serif",
  },
  {
    value: "prata",
    label: "Prata",
    fontFamily: "var(--font-preview-prata), serif",
  },
  {
    value: "archivo-black",
    label: "Archivo Black",
    fontFamily: "var(--font-preview-archivo-black), sans-serif",
  },
  {
    value: "big-shoulders-display",
    label: "Big Shoulders Display",
    fontFamily: "var(--font-preview-big-shoulders-display), sans-serif",
  },
];

export const bodyFontOptions: {
  value: string;
  label: string;
  fontFamily?: string;
}[] = [
  {
    value: "inter",
    label: "Inter",
    fontFamily: "var(--font-preview-inter), sans-serif",
  },
  {
    value: "manrope",
    label: "Manrope",
    fontFamily: "var(--font-preview-manrope), sans-serif",
  },
  {
    value: "work-sans",
    label: "Work Sans",
    fontFamily: "var(--font-preview-work-sans), sans-serif",
  },
  {
    value: "outfit",
    label: "Outfit",
    fontFamily: "var(--font-preview-outfit), sans-serif",
  },
  {
    value: "karla",
    label: "Karla",
    fontFamily: "var(--font-preview-karla), sans-serif",
  },
  {
    value: "sora",
    label: "Sora",
    fontFamily: "var(--font-preview-sora), sans-serif",
  },
  {
    value: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    fontFamily: "var(--font-preview-plus-jakarta-sans), sans-serif",
  },
  {
    value: "space-grotesk",
    label: "Space Grotesk",
    fontFamily: "var(--font-preview-space-grotesk), sans-serif",
  },
  {
    value: "urbanist",
    label: "Urbanist",
    fontFamily: "var(--font-preview-urbanist), sans-serif",
  },
  {
    value: "figtree",
    label: "Figtree",
    fontFamily: "var(--font-preview-figtree), sans-serif",
  },
  {
    value: "dm-sans",
    label: "DM Sans",
    fontFamily: "var(--font-preview-dm-sans), sans-serif",
  },
  {
    value: "nunito-sans",
    label: "Nunito Sans",
    fontFamily: "var(--font-preview-nunito-sans), sans-serif",
  },
];

export type FontPair = {
  id: string;
  name: string;
  displayFont: string;
  bodyFont: string;
};

/** Curated headings+body combinations — kept small and hand-picked rather
 * than exhaustive, since the point is "six reliably good options", not
 * covering the full font library (that's what the Shuffle button and the
 * individual Headings/Body search pickers below are for). Each font appears
 * in exactly one preset here. */
export const fontPairs: FontPair[] = [
  { id: "modern-classic", name: "Modern Classic", displayFont: "fraunces", bodyFont: "inter" },
  { id: "elegant", name: "Elegant", displayFont: "playfair", bodyFont: "manrope" },
  { id: "refined", name: "Refined", displayFont: "cormorant", bodyFont: "work-sans" },
  { id: "bold-editorial", name: "Bold Editorial", displayFont: "dm-serif-display", bodyFont: "outfit" },
  { id: "quiet-luxe", name: "Quiet Luxe", displayFont: "newsreader", bodyFont: "figtree" },
  { id: "market-bold", name: "Market Bold", displayFont: "archivo-black", bodyFont: "dm-sans" },
];

export function fontFamilyFor(kind: "display" | "body", value: string): string | undefined {
  const list = kind === "display" ? displayFontOptions : bodyFontOptions;
  return list.find((f) => f.value === value)?.fontFamily;
}

/** Preset divider glyphs for the announcement marquee. */
export const announcementDividerPresets = ["✦", "•", "·", "★", "/", "|"] as const;

export function sectionLabel(type: SectionType): string {
  return sectionCatalog.find((s) => s.type === type)?.label ?? type;
}

export function pageMeta(type: SitePageType) {
  return pageCatalog.find((p) => p.type === type);
}

export function pageSupportsSections(type: SitePageType) {
  return pageMeta(type)?.hasSections ?? false;
}

/** Whether the page shows a "1" content edit tool in the rail */
export function pageSupportsContentEdit(type: SitePageType) {
  return pageMeta(type)?.editable ?? false;
}

/** The route the preview is actually showing, against the server actually
 * serving it. Deliberately NOT the future softune.store URL: the user copies
 * this straight out of the URL bar into a nav link's route field, so it has to
 * be a URL that resolves right now. */
export function resolvePageUrl(page: SitePage, baseUrl: string) {
  const path = page.path.replace(":slug", "sample");
  return `${baseUrl.replace(/\/$/, "")}${path === "/" ? "/" : path}`;
}

// Preview-only: points at a running copy of the real storefront.
export const FALLBACK_PREVIEW_URL =
  process.env.NEXT_PUBLIC_PREVIEW_URL ?? "http://localhost:3050";

/** Resolve a stored media path against the template's own server.
 *
 * A freshly-uploaded Cloudinary image is already an absolute URL and passes
 * through unchanged. A template's bundled default (e.g. "/assets/hero-1.jpg",
 * seeded before any real upload happened) is relative to the STOREFRONT's own
 * origin (Aurora on :3050) — rendering it with a bare `<img src>` in the
 * DASHBOARD (:3000) resolves against the wrong origin and 404s. A blob: URL
 * (a locally-picked file not yet published — see pending-uploads.ts) is also
 * already a complete reference; prepending baseUrl to it produces a
 * malformed src like "http://localhost:3050/blob:http://localhost:3000/…",
 * which is why an unpublished pick looked broken in the editor. */
export function resolveMediaUrl(src: string, baseUrl: string): string {
  if (/^(https?:)?\/\//.test(src) || /^(blob|data):/.test(src)) return src;
  return `${baseUrl.replace(/\/$/, "")}${src.startsWith("/") ? src : `/${src}`}`;
}

/** Reduce whatever the user pasted into a nav link's route field to a path.
 *
 * They copy from the preview's address bar, which yields an absolute URL like
 * `http://localhost:3050/shop?__site=x`. Storing that would hard-code the dev
 * host into a link that has to keep working on the live domain — and the
 * `__site` preview param would leak into production navigation. */
export function toRoutePath(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    return value.startsWith("/") ? value : `/${value}`;
  }
  try {
    const url = new URL(value);
    url.searchParams.delete("__site");
    url.searchParams.delete("__r");
    return `${url.pathname}${url.search}` || "/";
  } catch {
    return value;
  }
}

