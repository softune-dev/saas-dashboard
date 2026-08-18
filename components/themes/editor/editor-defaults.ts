import {
  defaultPages,
  type ColorPalette,
  type PageSection,
  type SiteEditorSettings,
} from "./editor-types";

/** Aurora / boutique home section order (historical editor default). */
const auroraSections: PageSection[] = [
  { id: "s1", type: "banner" },
  { id: "s2", type: "hero" },
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

/** Marketplace home: trust strip right under hero, no testimonials/CTA. */
const bazaarSections: PageSection[] = [
  { id: "sec-1", type: "hero" },
  { id: "sec-2", type: "features" },
  { id: "sec-3", type: "categories" },
  { id: "sec-4", type: "featureProducts" },
  { id: "sec-5", type: "whyChooseUs" },
  { id: "sec-6", type: "footer" },
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
    siteName: "Modhu Bon",
    logoType: "text",
    logoImage: "",
    tagline: "Pure honey from the Sundarbans",
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
    announcementItems: [
      "Free shipping over 2000৳",
      "Crafted to last",
      "New season",
    ],
    announcementDivider: "✦",
    heroImages: ["/assets/hero-1.jpg", "/assets/hero-2.jpg"],
    heroImagesSquare: [],
    categoriesTitle: "Shop by category",
    selectedCategoryIds: ["1", "2", "5", "6"],
    featureProductsTitle: "Featured products",
    selectedProductIds: ["1", "2", "5"],
    showcaseProductId: "1",
    whyTitle: "Why choose us",
    whyImage: "",
    why1Title: "Guaranteed authentic craft",
    why1: "100% pure",
    why2Title: "Fast, secure delivery",
    why2: "Fast delivery",
    why3Title: "Real satisfaction, easy returns",
    why3: "Secure checkout",
    categoryShowcaseTitle: "Shop by collection",
    categoryShowcaseCategoryIds: ["1", "2", "5"],
    featuresTitle: "Features",
    feature1Title: "Natural",
    feature1: "100% natural ingredients",
    feature1IconKind: "icon",
    feature1Icon: "leaf",
    feature1Image: "",
    feature2Title: "Lab tested",
    feature2: "Every batch is lab tested",
    feature2IconKind: "icon",
    feature2Icon: "shield-check",
    feature2Image: "",
    feature3Title: "Eco pack",
    feature3: "Eco-friendly packaging",
    feature3IconKind: "icon",
    feature3Icon: "package",
    feature3Image: "",
    testimonialsTitle: "What customers say",
    testimonials: [
      {
        id: "t1",
        name: "Ayesha",
        quote: "Best honey I have ever tasted.",
        image: "",
      },
      {
        id: "t2",
        name: "Karim",
        quote: "Fast delivery and great quality.",
        image: "",
      },
    ],
    ctaTitle: "Ready to try?",
    ctaBody: "Order today and taste the difference.",
    ctaButton: "Shop collection",
    footerDescription: "Pure, farm-fresh honey delivered across Bangladesh.",
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
    announcementItems: [
      "Free delivery over ৳2,500",
      "COD available nationwide",
      "Easy 7-day returns",
    ],
    announcementDivider: "·",
    heroImages: [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80",
    ],
    heroImagesSquare: [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
    ],
    categoriesTitle: "Shop by Category",
    selectedCategoryIds: [],
    featureProductsTitle: "Best Sellers",
    selectedProductIds: [],
    showcaseProductId: "",
    whyTitle: "Why shop with us",
    whyImage:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1000&q=80",
    why1Title: "Curated catalog",
    why1: "Thousands of products across everyday categories — filtered, priced, and ready to ship.",
    why2Title: "Transparent pricing",
    why2: "Clear delivery charges by area, no surprise fees at checkout.",
    why3Title: "Buyer protection",
    why3: "COD, secure payments, and hassle-free returns when something isn't right.",
    categoryShowcaseTitle: "Popular departments",
    categoryShowcaseCategoryIds: [],
    featuresTitle: "Why customers trust us",
    feature1Title: "Wide Range",
    feature1:
      "Millions of products across categories — find what you need in one place.",
    feature1IconKind: "icon",
    feature1Icon: "package",
    feature1Image: "",
    feature2Title: "Best Prices",
    feature2:
      "Unbeatable deals and everyday low prices with clear discount labels.",
    feature2IconKind: "icon",
    feature2Icon: "tag",
    feature2Image: "",
    feature3Title: "Fast Delivery",
    feature3:
      "Reliable delivery across Bangladesh with area-based shipping rates.",
    feature3IconKind: "icon",
    feature3Icon: "truck",
    feature3Image: "",
    testimonialsTitle: "",
    testimonials: [],
    ctaTitle: "",
    ctaBody: "",
    ctaButton: "",
    footerDescription:
      "Bazaar is a multi-category marketplace for everyday essentials — electronics, fashion, home, and more. Built for merchants who sell everything.",
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
    announcementItems: [
      "ঢাকা সিটিতে ৩ ঘণ্টার মধ্যে ফাস্ট সেম-ডে ডেলিভারি!",
    ],
    announcementDivider: "·",
    heroImages: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=85",
    ],
    heroImagesSquare: [],
    categoriesTitle: "ক্যাটাগরি সমূহ",
    selectedCategoryIds: [],
    featureProductsTitle: "বেস্ট সেলার",
    selectedProductIds: [],
    showcaseProductId: "",
    whyTitle: "কেন আমাদের মিষ্টি পছন্দ করবেন?",
    whyImage: "",
    why1Title: "খাঁটি উপাদান",
    why1: "১০০% খাঁটি গাভীর দুধ ও প্রিজারভেটিভ মুক্ত",
    why2Title: "নিরাপদ প্যাকেজিং",
    why2: "হাইজেনিক পরিবেশে তৈরি ও সুরক্ষামূলক প্যাকেজিং",
    why3Title: "দ্রুত ডেলিভারি",
    why3: "দ্রুত সেম-ডে হোম ডেলিভারি সুবিধা",
    categoryShowcaseTitle: "সংগ্রহ",
    categoryShowcaseCategoryIds: [],
    featuresTitle: "আমাদের অঙ্গীকার",
    feature1Title: "প্রাকৃতিক",
    feature1: "প্রাকৃতিক সেরা উপাদান দিয়ে তৈরি",
    feature1IconKind: "icon",
    feature1Icon: "leaf",
    feature1Image: "",
    feature2Title: "ঐতিহ্য",
    feature2: "অভিজ্ঞ কারিগরদের ঐতিহ্যবাহী রেসিপি",
    feature2IconKind: "icon",
    feature2Icon: "heart",
    feature2Image: "",
    feature3Title: "ডেলিভারি",
    feature3: "সারা দেশে নিরাপদ ডেলিভারি সার্ভিস",
    feature3IconKind: "icon",
    feature3Icon: "truck",
    feature3Image: "",
    testimonialsTitle: "গ্রাহকদের মিষ্টি অনুভূতি",
    testimonials: [
      {
        id: "t-1",
        name: "তানজিলা রহমান",
        quote:
          "মিষ্টিঘরের নকশি পিঠা আর বোখারার আচার অসাধারণ! প্রতি উৎসবে আমাদের প্রথম পছন্দ মিষ্টিঘর।",
        image: "",
      },
      {
        id: "t-2",
        name: "রাফসান আহমেদ",
        quote:
          "বগুড়ার দইয়ের স্বাদ একদম আসল! ৩ ঘণ্টার মধ্যে হোম ডেলিভারি পেয়েছি।",
        image: "",
      },
    ],
    ctaTitle: "উৎসবের বিশেষ মিষ্টি কম্বো প্যাক",
    ctaBody: "আজই অর্ডার করুন এবং যেকোনো কম্বো প্যাকে পান ১০% ছাড়!",
    ctaButton: "অফারটি গ্রহণ করুন",
    footerDescription:
      "ঐতিহ্যবাহী স্বাদের খাঁটি গাভীর দুধের মিষ্টি, বগুড়ার ঐতিহ্যবাহী মিষ্টি দই ও গরম মচমচে খাস নাস্তা।",
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
