import type { SiteEditorSettings } from "./editor-types";

/** One changed group, ready to render as a compact publish-modal line. */
export type ThemeChange = { label: string; detail?: string };

/** Which SiteEditorSettings fields belong to which sidebar panel — mirrors
 * the panels in editor-sidebar.tsx, so "what changed" reads the same
 * language as "where you'd go to change it." Grouped rather than per-field:
 * a merchant who edited 4 footer fields wants to see "Footer", not 4 lines. */
const GROUPS: { label: string; fields: (keyof SiteEditorSettings)[] }[] = [
  { label: "Brand", fields: ["siteName", "logoType", "logoImage", "tagline", "displayFont", "bodyFont", "buttonStyle"] },
  { label: "Colors", fields: ["primaryColor", "accentColor", "surfaceColor"] },
  { label: "Header", fields: ["navLinks", "headerButtons"] },
  { label: "Pages", fields: ["pages"] },
  { label: "Section order", fields: ["sections"] },
  { label: "Banner", fields: ["announcementItems", "announcementDivider"] },
  { label: "Hero images", fields: ["heroImages", "heroImagesSquare"] },
  { label: "Categories section", fields: ["categoriesTitle", "selectedCategoryIds"] },
  { label: "Feature products", fields: ["featureProductsTitle", "selectedProductIds"] },
  { label: "Product showcase", fields: ["showcaseProductId"] },
  { label: "Why choose us", fields: ["whyTitle", "whyImage", "why1Title", "why1", "why2Title", "why2", "why3Title", "why3"] },
  { label: "Category showcase", fields: ["categoryShowcaseTitle", "categoryShowcaseCategoryIds"] },
  {
    label: "Feature section",
    fields: [
      "featuresTitle",
      "feature1Title", "feature1", "feature1IconKind", "feature1Icon", "feature1Image",
      "feature2Title", "feature2", "feature2IconKind", "feature2Icon", "feature2Image",
      "feature3Title", "feature3", "feature3IconKind", "feature3Icon", "feature3Image",
    ],
  },
  { label: "Testimonials", fields: ["testimonialsTitle", "testimonials", "testimonialsCards", "testimonialsScreenshots"] },
  { label: "Banner CTA", fields: ["ctaTitle", "ctaBody", "ctaButton"] },
  { label: "Footer", fields: ["footerDescription", "footerShopLabel", "footerShopLinks", "footerCompanyLabel", "footerCompanyLinks"] },
];

/** Compares the draft about to be published against what's currently live
 * and returns a compact, panel-grouped list of what changed — so the
 * publish confirm modal can show "what am I actually about to push" instead
 * of a bare "Publish?" with no context. Field-value comparison via
 * JSON.stringify is fine here: settings is plain, JSON-serializable data
 * with no functions/dates, same assumption editor-types.ts's own `snapshot`
 * dirty-check already makes. */
export function summarizeThemeChanges(
  current: SiteEditorSettings,
  published: SiteEditorSettings,
): ThemeChange[] {
  const changes: ThemeChange[] = [];

  for (const group of GROUPS) {
    const changedFields = group.fields.filter(
      (field) => JSON.stringify(current[field]) !== JSON.stringify(published[field]),
    );
    if (changedFields.length === 0) continue;

    // Array fields get a count-based detail ("3 items") when the change is
    // additions/removals rather than an edit to existing text — more useful
    // than just "Header changed" for a merchant deciding whether to publish.
    const arrayField = changedFields.find((f) => Array.isArray(current[f]));
    let detail: string | undefined;
    if (arrayField && changedFields.length === 1) {
      const before = published[arrayField];
      const after = current[arrayField];
      if (Array.isArray(before) && Array.isArray(after) && before.length !== after.length) {
        detail = `${before.length} → ${after.length} items`;
      }
    }

    changes.push({ label: group.label, detail });
  }

  return changes;
}
