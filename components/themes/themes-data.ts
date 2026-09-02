export type ThemeStatus = "active" | "locked";

export type ThemeCard = {
  id: string;
  status: ThemeStatus;
  /** e.g. social media funnel label for locked cards */
  subtitle?: string;
  /** Display name for a locked card — there's no real site to pull a real
   * name from, unlike active cards (see ThemeCard's shopName). */
  label?: string;
  /** Static preview image for a locked card, under /public — active cards
   * use the real site's live screenshot_url instead (see theme-card.tsx). */
  imageSrc?: string;
  /**
   * Which storefront project this card's editor drives. Used to pick the
   * right preview server and to namespace this site's draft/published
   * localStorage keys so two sites never clobber each other's edits.
   */
  previewUrl?: string;
};

/** Static per-template metadata only — shop name and product/category
 * counts are real, per-tenant data and are fetched live in ThemesGrid/
 * ThemeCard instead of living here. */
export const themes: ThemeCard[] = [
  {
    id: "aurora",
    status: "active",
    // Falls back to this whenever the tenant's own site.screenshot_url isn't
    // ready yet (a worker job captures that ~90s after first publish — see
    // app/worker.py's handle_capture_screenshot) — without it, a brand-new
    // trial site's card renders with no image at all until then.
    imageSrc: "/theme-aurora.webp",
    previewUrl: "https://saas-theme1.vercel.app",
  },
  {
    id: "sweets",
    status: "active",
    // Not deployed yet — still points at the local dev server. Update once
    // Sweets has a real Vercel project like Aurora/Bazaar above, and add a
    // fallback imageSrc alongside them once one exists.
    previewUrl: "http://localhost:3051",
  },
  {
    id: "bazaar",
    status: "active",
    imageSrc: "/theme-bazaar.webp",
    previewUrl: "https://saas-theme2.vercel.app",
  },
  {
    id: "funnels",
    status: "locked",
    label: "Add Funnels",
    subtitle: "Social media funnel only",
    imageSrc: "/others/theme_aurora.jpg",
  },
];

export function getThemeById(id: string): ThemeCard | undefined {
  return themes.find((t) => t.id === id);
}
