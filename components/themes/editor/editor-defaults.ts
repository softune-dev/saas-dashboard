import {
  defaultPages,
  type ColorPalette,
  type PageSection,
  type SiteEditorSettings,
} from "./editor-types";

/** Aurora / boutique home section order (historical editor default).
 * "events" is deliberately excluded — a merchant adds it themselves from
 * the section picker once they actually have a sale campaign to run,
 * rather than every new site shipping an empty Events section by default. */
const auroraSections: PageSection[] = [
  { id: "s2", type: "hero" },
  { id: "s1", type: "banner" },
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

/** Marketplace home — every section bazaar's own SectionRenderer.tsx
 * actually renders, except "banner": bazaar's hero already owns that
 * promo-strip role (see SectionRenderer.tsx's own comment), so a "banner"
 * section there is a permanent no-op — including it as a default would put
 * a section in the editor's list that visibly does nothing on the live
 * site, which is exactly the misleading-editor problem this default order
 * exists to avoid. "events" is likewise deliberately excluded — a merchant
 * adds it themselves once they have a real sale campaign to run. */
const bazaarSections: PageSection[] = [
  { id: "sec-1", type: "hero" },
  { id: "sec-2", type: "features" },
  { id: "sec-3", type: "categories" },
  { id: "sec-4", type: "featureProducts" },
  { id: "sec-5", type: "productShowcase" },
  { id: "sec-6", type: "categoryShowcase" },
  { id: "sec-7", type: "whyChooseUs" },
  { id: "sec-8", type: "testimonials" },
  { id: "sec-9", type: "bannerCta" },
  { id: "sec-10", type: "footer" },
];

/** Sweets / bakery-oriented home order. */
const sweetsSections: PageSection[] = [
  { id: "sec-hero", type: "hero" },
  { id: "sec-why", type: "whyChooseUs" },
  { id: "sec-categories", type: "categories" },
  { id: "sec-featured", type: "featureProducts" },
  { id: "sec-showcase", type: "productShowcase" },
  { id: "sec-testimonials", type: "testimonials" },
  { id: "sec-cta", type: "bannerCta" },
  { id: "sec-footer", type: "footer" },
];

/**
 * Placeholder / backfill content per storefront template key (themes-data id).
 * Only used when a draft is missing or partial — never overrides a real
 * saved/remote theme field that is already present.
 */
export const defaultSiteSettingsByTheme: Record<string, SiteEditorSettings> = {
  aurora: {
    siteName: "Aurora",
    logoType: "text",
    logoImage: "",
    tagline: "Editorial fashion and lifestyle, considered.",
    primaryColor: "#FF5A36",
    accentColor: "#171717",
    surfaceColor: "#F4F4F5",
    displayFont: "fraunces",
    bodyFont: "inter",
    buttonStyle: "Pill",
    navLinks: [
      { id: "n1", label: "Shop", path: "/shop" },
      { id: "n2", label: "About", path: "/about" },
      { id: "n3", label: "Contact", path: "/contact" },
    ],
    headerButtons: [{ id: "b1", label: "Cart", style: "primary" }],
    pages: defaultPages,
    sections: auroraSections,
    // Everything below this line is CONTENT, not visual scaffolding — real
    // marketing copy, images, and claims about a specific business. These
    // must never ship as real defaults: a fresh site used to get "100%
    // pure" / "lab tested" / broken /assets/hero-*.jpg paths baked
    // straight into Site.theme the moment a merchant published, without
    // ever writing or reviewing a word of it themselves. Left empty on
    // purpose — the storefront template itself renders its own tasteful
    // empty-state skeleton/fallback UI when these are blank (see
    // templates/aurora's section components), so there's no need for a
    // fake value here to "fill the gap."
    announcementItems: [],
    announcementDivider: "✦",
    heroImages: [],
    heroImagesSquare: [],
    selectedEventIds: [],
    categoriesTitle: "Shop by category",
    selectedCategoryIds: [],
    featureProductsTitle: "Featured products",
    selectedProductIds: [],
    showcaseProductId: "",
    whyTitle: "Why choose us",
    whyImage: "",
    why1Title: "",
    why1: "",
    why2Title: "",
    why2: "",
    why3Title: "",
    why3: "",
    categoryShowcaseTitle: "Shop by collection",
    categoryShowcaseCategoryIds: [],
    featuresTitle: "Features",
    feature1Title: "",
    feature1: "",
    feature1IconKind: "icon",
    feature1Icon: "",
    feature1Image: "",
    feature2Title: "",
    feature2: "",
    feature2IconKind: "icon",
    feature2Icon: "",
    feature2Image: "",
    feature3Title: "",
    feature3: "",
    feature3IconKind: "icon",
    feature3Icon: "",
    feature3Image: "",
    testimonialsMode: "cards",
    testimonialsTitle: "",
    testimonials: [],
    testimonialsCards: [],
    testimonialsScreenshots: [],
    ctaTitle: "",
    ctaBody: "",
    ctaButton: "",
    footerDescription: "",
    footerShopLabel: "Shop",
    footerShopLinks: [
      { id: "fs1", label: "All products", path: "/shop" },
    ],
    footerCompanyLabel: "Company",
    footerCompanyLinks: [
      { id: "fc1", label: "About", path: "/about" },
      { id: "fc2", label: "Contact", path: "/contact" },
    ],
  },

  bazaar: {
    siteName: "Bazaar",
    logoType: "text",
    logoImage: "",
    tagline: "Everything you need, delivered",
    primaryColor: "#2563EB",
    accentColor: "#0F172A",
    surfaceColor: "#F8FAFC",
    displayFont: "outfit",
    bodyFont: "inter",
    buttonStyle: "Rounded",
    navLinks: [
      { id: "nav-1", label: "Home", path: "/" },
      { id: "nav-2", label: "Shop", path: "/shop" },
      { id: "nav-3", label: "Best Sellers", path: "/shop?filter=featured" },
      { id: "nav-4", label: "New Arrivals", path: "/shop?sort=new" },
      { id: "nav-5", label: "Deals", path: "/shop?filter=featured" },
      { id: "nav-6", label: "Track Order", path: "/faq" },
      { id: "nav-7", label: "Customer Support", path: "/contact" },
    ],
    headerButtons: [],
    pages: defaultPages,
    sections: bazaarSections,
    // See Aurora's block above for why everything below is intentionally
    // empty rather than pre-filled — this is real content/copy, not
    // visual scaffolding, and must never be silently saved as if the
    // merchant wrote it.
    announcementItems: [],
    announcementDivider: "·",
    heroImages: [],
    heroImagesSquare: [],
    selectedEventIds: [],
    categoriesTitle: "Shop by Category",
    selectedCategoryIds: [],
    featureProductsTitle: "Best Sellers",
    selectedProductIds: [],
    showcaseProductId: "",
    whyTitle: "Why shop with us",
    whyImage: "",
    why1Title: "",
    why1: "",
    why2Title: "",
    why2: "",
    why3Title: "",
    why3: "",
    categoryShowcaseTitle: "Popular departments",
    categoryShowcaseCategoryIds: [],
    featuresTitle: "Why customers trust us",
    feature1Title: "",
    feature1: "",
    feature1IconKind: "icon",
    feature1Icon: "",
    feature1Image: "",
    feature2Title: "",
    feature2: "",
    feature2IconKind: "icon",
    feature2Icon: "",
    feature2Image: "",
    feature3Title: "",
    feature3: "",
    feature3IconKind: "icon",
    feature3Icon: "",
    feature3Image: "",
    testimonialsMode: "cards",
    testimonialsTitle: "",
    testimonials: [],
    testimonialsCards: [],
    testimonialsScreenshots: [],
    ctaTitle: "",
    ctaBody: "",
    ctaButton: "",
    footerDescription: "",
    footerShopLabel: "Shop",
    footerShopLinks: [
      { id: "fs1", label: "All products", path: "/shop" },
      { id: "fs2", label: "Featured", path: "/shop?filter=featured" },
      { id: "fs3", label: "New arrivals", path: "/shop?sort=new" },
      { id: "fs4", label: "Categories", path: "/categories" },
    ],
    footerCompanyLabel: "Company",
    footerCompanyLinks: [
      { id: "fc1", label: "About", path: "/about" },
      { id: "fc2", label: "Contact", path: "/contact" },
      { id: "fc3", label: "FAQ", path: "/faq" },
      { id: "fc4", label: "Privacy", path: "/privacy" },
      { id: "fc5", label: "Terms", path: "/terms" },
    ],
  },

  sweets: {
    siteName: "মিষ্টিঘর",
    logoType: "text",
    logoImage: "",
    tagline: "ঐতিহ্যবাহী নিখাদ মিষ্টি ও খাস নাস্তা",
    primaryColor: "#DC5200",
    accentColor: "#3F2A1D",
    surfaceColor: "#FAF5EF",
    displayFont: "fraunces",
    bodyFont: "inter",
    buttonStyle: "Rounded",
    navLinks: [
      { id: "nav-1", label: "হোম", path: "/" },
      { id: "nav-2", label: "সকল মিষ্টি", path: "/shop" },
      { id: "nav-3", label: "ক্যাটাগরি", path: "/categories" },
      { id: "nav-4", label: "আমাদের কথা", path: "/about" },
      { id: "nav-5", label: "যোগাযোগ", path: "/contact" },
    ],
    headerButtons: [
      { id: "btn-1", label: "অর্ডার ট্র্যাক", style: "outline" },
    ],
    pages: defaultPages,
    sections: sweetsSections,
    announcementItems: [],
    announcementDivider: "·",
    heroImages: [],
    heroImagesSquare: [],
    // Not in sweetsSections above (this theme is out of scope for the
    // Events feature) — kept only because SiteEditorSettings requires it.
    selectedEventIds: [],
    categoriesTitle: "ক্যাটাগরি সমূহ",
    selectedCategoryIds: [],
    featureProductsTitle: "বেস্ট সেলার",
    selectedProductIds: [],
    showcaseProductId: "",
    whyTitle: "কেন আমাদের মিষ্টি পছন্দ করবেন?",
    whyImage: "",
    why1Title: "",
    why1: "",
    why2Title: "",
    why2: "",
    why3Title: "",
    why3: "",
    categoryShowcaseTitle: "সংগ্রহ",
    categoryShowcaseCategoryIds: [],
    featuresTitle: "আমাদের অঙ্গীকার",
    feature1Title: "",
    feature1: "",
    feature1IconKind: "icon",
    feature1Icon: "",
    feature1Image: "",
    feature2Title: "",
    feature2: "",
    feature2IconKind: "icon",
    feature2Icon: "",
    feature2Image: "",
    feature3Title: "",
    feature3: "",
    feature3IconKind: "icon",
    feature3Icon: "",
    feature3Image: "",
    testimonialsMode: "cards",
    testimonialsTitle: "",
    testimonials: [],
    testimonialsCards: [],
    testimonialsScreenshots: [],
    ctaTitle: "",
    ctaBody: "",
    ctaButton: "",
    footerDescription: "",
    footerShopLabel: "কেনাকাটা",
    footerShopLinks: [
      { id: "fs1", label: "সকল মিষ্টি", path: "/shop" },
      { id: "fs2", label: "ক্যাটাগরি", path: "/categories" },
    ],
    footerCompanyLabel: "কোম্পানি",
    footerCompanyLinks: [
      { id: "fc1", label: "আমাদের কথা", path: "/about" },
      { id: "fc2", label: "যোগাযোগ", path: "/contact" },
      { id: "fc3", label: "প্রশ্নোত্তর", path: "/faq" },
    ],
  },
};

/** Aurora keeps boutique/editorial combos; Bazaar is e-commerce trust blues
 * and deal oranges; Sweets is warm dessert tones. First palette in each list
 * is that template's shipped base colors. */
export const colorPalettesByTheme: Record<string, ColorPalette[]> = {
  aurora: [
    {
      id: "espresso",
      name: "Espresso",
      primaryColor: "#2C220F",
      accentColor: "#221E19",
      surfaceColor: "#FAF9F6",
    },
    {
      id: "midnight",
      name: "Midnight",
      primaryColor: "#0F172A",
      accentColor: "#221E19",
      surfaceColor: "#FFFFFF",
    },
    {
      id: "forest-linen",
      name: "Forest & Linen",
      primaryColor: "#14532D",
      accentColor: "#292524",
      surfaceColor: "#D9CFBB",
    },
    {
      id: "rust-oat",
      name: "Rust & Oat",
      primaryColor: "#7C2D12",
      accentColor: "#2C220F",
      surfaceColor: "#EFEBE2",
    },
  ],
  bazaar: [
    {
      id: "bazaar-default",
      name: "Marketplace Blue",
      primaryColor: "#2563EB",
      accentColor: "#0F172A",
      surfaceColor: "#F8FAFC",
    },
    {
      id: "deal-orange",
      name: "Deal Orange",
      primaryColor: "#EA580C",
      accentColor: "#1C1917",
      surfaceColor: "#FFF7ED",
    },
    {
      id: "trust-teal",
      name: "Trust Teal",
      primaryColor: "#0D9488",
      accentColor: "#134E4A",
      surfaceColor: "#F0FDFA",
    },
    {
      id: "sale-red",
      name: "Sale Red",
      primaryColor: "#DC2626",
      accentColor: "#171717",
      surfaceColor: "#FAFAFA",
    },
  ],
  sweets: [
    {
      id: "mishthan-default",
      name: "Misty Saffron",
      primaryColor: "#DC5200",
      accentColor: "#3F2A1D",
      surfaceColor: "#FAF5EF",
    },
    {
      id: "jaggery",
      name: "Jaggery",
      primaryColor: "#B45309",
      accentColor: "#292524",
      surfaceColor: "#FFFBEB",
    },
    {
      id: "cardamom",
      name: "Cardamom",
      primaryColor: "#4D7C0F",
      accentColor: "#1C1917",
      surfaceColor: "#F7FEE7",
    },
    {
      id: "rose-milk",
      name: "Rose Milk",
      primaryColor: "#E11D48",
      accentColor: "#3F2A1D",
      surfaceColor: "#FFF1F2",
    },
  ],
};

const FALLBACK_THEME = "aurora";

export function getDefaultSiteSettings(
  themeId: string | null | undefined,
): SiteEditorSettings {
  const key = themeId && defaultSiteSettingsByTheme[themeId] ? themeId : FALLBACK_THEME;
  return defaultSiteSettingsByTheme[key];
}

export function getColorPalettes(
  themeId: string | null | undefined,
): ColorPalette[] {
  const key = themeId && colorPalettesByTheme[themeId] ? themeId : FALLBACK_THEME;
  return colorPalettesByTheme[key];
}

/** @deprecated Prefer getDefaultSiteSettings(themeId). Kept as Aurora default
 * so any leftover bare import still resolves without crashing. */
export const defaultSiteSettings =
  defaultSiteSettingsByTheme[FALLBACK_THEME];

/** @deprecated Prefer getColorPalettes(themeId). */
export const colorPalettes = colorPalettesByTheme[FALLBACK_THEME];
