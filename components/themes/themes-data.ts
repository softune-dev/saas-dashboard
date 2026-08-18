export type ThemeStatus = "active" | "locked";

export type ThemeCard = {
  id: string;
  shopName: string;
  productsCount: number;
  categoriesCount: number;
  status: ThemeStatus;
  /** e.g. social media funnel label for locked cards */
  subtitle?: string;
  /**
   * Which storefront project this card's editor drives. Used to pick the
   * right preview server and to namespace this site's draft/published
   * localStorage keys so two sites never clobber each other's edits.
   */
  previewUrl?: string;
};

/** One card per storefront template project. */
export const themes: ThemeCard[] = [
  {
    id: "aurora",
    shopName: "Aurora — Ananya Lifestyle",
    productsCount: 6,
    categoriesCount: 5,
    status: "active",
    previewUrl: "http://localhost:3050",
  },
  {
    id: "sweets",
    shopName: "Mishthan — মিষ্টিঘর",
    productsCount: 0,
    categoriesCount: 0,
    status: "active",
    previewUrl: "http://localhost:3051",
  },
  {
    id: "bazaar",
    shopName: "Bazaar — Multi-category marketplace",
    productsCount: 12,
    categoriesCount: 10,
    status: "active",
    previewUrl: "http://localhost:3052",
  },
];

export function getThemeById(id: string): ThemeCard | undefined {
  return themes.find((t) => t.id === id);
}
