import { getDefaultSiteSettings } from "./editor/editor-defaults";
import type { SiteEditorSettings } from "./editor/editor-types";

/** Fired on same-tab updates so theme cards can refresh */
export const THEME_STORE_EVENT = "softune-theme-store";

// Keys are namespaced per siteId so two site cards (e.g. "aurora" and
// "sweets") never read or overwrite each other's draft/published state.
// siteId here is the template key from themes-data (aurora | bazaar | sweets).
const draftKey = (siteId: string) => `softune.theme.${siteId}.draft`;
const publishedKey = (siteId: string) => `softune.theme.${siteId}.published`;
const unpublishedKey = (siteId: string) =>
  `softune.theme.${siteId}.hasUnpublished`;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(THEME_STORE_EVENT));
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Merge a stored draft over the template's own defaults, field by field.
 *
 * A draft saved before a schema change (e.g. this session added
 * footerShopLinks) is missing whatever fields didn't exist yet. Without this
 * merge, every editor panel touching a newer field has to defensively guard
 * against `undefined` itself — and every future schema change reintroduces
 * the same crash somewhere new. One merge point here fixes the whole class.
 *
 * Defaults are per-template (siteId): Bazaar never backfills with Aurora's
 * honey-shop copy, and vice versa.
 */
function withDefaults(
  siteId: string,
  stored: SiteEditorSettings | null,
): SiteEditorSettings {
  const defaults = getDefaultSiteSettings(siteId);
  if (!stored) return defaults;
  const merged = { ...defaults, ...stored };

  // Cards/screenshots used to share one `testimonials` list (bug: switching
  // mode edited the same array). A draft/remote theme saved before the split
  // has real data in `testimonials` but not yet in the new per-mode field —
  // backfill whichever mode was active so that data isn't lost.
  if (!stored.testimonialsCards?.length && !stored.testimonialsScreenshots?.length && stored.testimonials?.length) {
    if (stored.testimonialsMode === "images") {
      merged.testimonialsScreenshots = stored.testimonials;
    } else {
      merged.testimonialsCards = stored.testimonials;
    }
  }
  return merged;
}

export function loadThemeDraft(siteId: string): SiteEditorSettings {
  return withDefaults(siteId, readJson<SiteEditorSettings>(draftKey(siteId)));
}

/** Keys this template's defaultSiteSettings defines that the RAW stored draft
 * is missing — i.e. fields added to the schema after this draft was last saved.
 *
 * Deliberately reads the raw, un-defaulted JSON rather than loadThemeDraft():
 * loadThemeDraft() already backfilled these with the template placeholder
 * values, which would make every key look "present" and hide exactly the gap
 * this exists to find. The caller uses this list to backfill from the site's
 * REAL remote theme instead.
 */
export function getDraftMissingKeys(
  siteId: string,
): (keyof SiteEditorSettings)[] {
  const raw = readJson<Partial<SiteEditorSettings>>(draftKey(siteId));
  if (!raw) return [];
  const defaults = getDefaultSiteSettings(siteId);
  return (Object.keys(defaults) as (keyof SiteEditorSettings)[]).filter(
    (key) => !(key in raw),
  );
}

/** True once this site has ever been saved locally — used to decide whether
 * to hydrate from the real backend theme on first load instead of the
 * built-in placeholder settings. */
export function hasThemeDraft(siteId: string): boolean {
  return readJson<SiteEditorSettings>(draftKey(siteId)) != null;
}

/** Seed local draft + published state from the site's real backend theme.
 * Only meaningful the first time the editor opens for a site — after that,
 * the customer's own edits are the source of truth until they publish again. */
export function seedThemeFromRemote(
  siteId: string,
  theme: SiteEditorSettings,
) {
  writeJson(draftKey(siteId), theme);
  writeJson(publishedKey(siteId), theme);
  if (canUseStorage()) localStorage.removeItem(unpublishedKey(siteId));
  notify();
}

export function loadThemePublished(siteId: string): SiteEditorSettings {
  return withDefaults(
    siteId,
    readJson<SiteEditorSettings>(publishedKey(siteId)),
  );
}

/** Save from the editor — becomes a draft until published */
export function saveThemeDraft(siteId: string, settings: SiteEditorSettings) {
  writeJson(draftKey(siteId), settings);
  const published = readJson<SiteEditorSettings>(publishedKey(siteId));
  const same =
    published != null &&
    JSON.stringify(published) === JSON.stringify(settings);
  if (canUseStorage()) {
    if (same) localStorage.removeItem(unpublishedKey(siteId));
    else localStorage.setItem(unpublishedKey(siteId), "1");
  }
  notify();
}

/** Push saved draft to the live site */
export function publishThemeDraft(siteId: string): boolean {
  const draft = readJson<SiteEditorSettings>(draftKey(siteId));
  if (!draft) return false;
  writeJson(publishedKey(siteId), draft);
  if (canUseStorage()) localStorage.removeItem(unpublishedKey(siteId));
  notify();
  return true;
}

export function hasUnpublishedThemeDraft(siteId: string): boolean {
  if (!canUseStorage()) return false;
  if (localStorage.getItem(unpublishedKey(siteId)) === "1") return true;
  const draft = readJson<SiteEditorSettings>(draftKey(siteId));
  const published = readJson<SiteEditorSettings>(publishedKey(siteId));
  if (!draft) return false;
  if (!published) return true;
  return JSON.stringify(draft) !== JSON.stringify(published);
}
