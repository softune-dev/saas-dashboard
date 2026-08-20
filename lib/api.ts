/**
 * Backend client core: token storage, the shared fetch wrapper, auth, and
 * sites. Product/category/order CRUD lives in lib/api/commerce.ts (mirrors
 * the backend's own app/api/commerce.py) and imports `request`/`API_URL`
 * from here rather than duplicating the fetch wrapper.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "softune.auth.token";
const REFRESH_TOKEN_KEY = "softune.auth.refreshToken";

/** Fired when both the access token AND a refresh attempt have failed —
 * AuthGate listens for this to drop back to the login screen. Plain
 * `storage` events don't fire in the SAME tab that changed localStorage, so
 * a same-tab session expiry needs its own signal. */
export const AUTH_EXPIRED_EVENT = "softune-auth-expired";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Every list endpoint that supports pagination returns this exact envelope
 * (see app/schemas.py's Page[T]) — categories and pages are the two
 * exceptions and return a plain array instead. */
export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

type TokenPair = { access_token: string; refresh_token: string };

/** Access tokens expire after 30 minutes by default (app/config.py) — a
 * dashboard session realistically lasts longer than that, so a 401 triggers
 * exactly one silent refresh-and-retry before giving up. Without this, every
 * user gets logged out mid-session for no visible reason. */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as TokenPair;
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  _isRetry = false,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && !_isRetry && getRefreshToken()) {
    if (await refreshAccessToken()) {
      return request<T>(path, init, true);
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  // DELETE endpoints return 204 No Content — res.json() would throw on the
  // empty body.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await request<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.access_token, data.refresh_token);
}

export type UserOut = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  timezone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type TenantOut = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
};

export type MeOut = { user: UserOut; tenant: TenantOut };

/** "Who am I" — the dashboard shell calls this once on load to show the
 * real signed-in user and tenant instead of a hardcoded name. */
export async function getMe(): Promise<MeOut> {
  return request<MeOut>("/auth/me");
}

/** PATCH /auth/me — full_name, phone, timezone are editable here. Email/
 * role/tenant changes need flows this doesn't have yet (re-verification,
 * permissions). */
export async function updateMe(data: {
  full_name?: string;
  phone?: string;
  timezone?: string;
  avatar_url?: string;
}): Promise<MeOut> {
  return request<MeOut>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await request<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type TemplateOut = { id: string; key: string };

/** The template catalog — shared across tenants, never changes per session,
 * so one fetch is cached and reused for the rest of the tab's lifetime
 * instead of re-fetching on every visit to a page (e.g. /themes) that needs
 * it. */
let templatesCache: Promise<TemplateOut[]> | null = null;
export async function listTemplates(): Promise<TemplateOut[]> {
  if (!templatesCache) {
    templatesCache = request<TemplateOut[]>("/templates").catch((err) => {
      templatesCache = null; // let a failed fetch be retried next call
      throw err;
    });
  }
  return templatesCache;
}

export type SiteOut = {
  id: string;
  tenant_id: string;
  template_id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  status: string;
  theme: Record<string, unknown>;
  /** Contact/business JSONB — may include logo_url when set in Site Settings. */
  business?: Record<string, unknown>;
};

/** Prefer theme brand image, then business.logo_url. Empty/missing → null
 * so the UI can fall back to the shop-bag circle (same as the header pill). */
export function resolveSiteLogoUrl(
  site: SiteOut | null | undefined,
): string | null {
  if (!site) return null;
  const theme = site.theme ?? {};
  const logoType = theme.logoType;
  const logoImage =
    typeof theme.logoImage === "string" ? theme.logoImage.trim() : "";
  // Image mode with a URL, or any absolute logo URL left on the theme.
  if (logoImage && (logoType === "image" || /^https?:\/\//i.test(logoImage))) {
    return logoImage;
  }
  const businessLogo = site.business?.logo_url;
  if (typeof businessLogo === "string" && businessLogo.trim()) {
    return businessLogo.trim();
  }
  return null;
}

/** Every site this tenant owns. Used to resolve "the current site" for the
 * commerce pages (Categories/Products/Orders) — see SiteContext. */
export async function listSites(): Promise<SiteOut[]> {
  const page = await request<Page<SiteOut>>("/sites?limit=100");
  return page.items;
}

/** Find the real site a theme catalog card (e.g. "aurora") maps to. */
export async function findSiteByTemplateKey(
  templateKey: string,
): Promise<SiteOut | null> {
  const templates = await listTemplates();
  const template = templates.find((t) => t.key === templateKey);
  if (!template) return null;

  const sites = await listSites();
  return sites.find((s) => s.template_id === template.id) ?? null;
}

/** Template keys this tenant actually has a site for — e.g. {"bazaar"} for a
 * tenant whose one site uses Bazaar. Drives which theme cards are shown; a
 * tenant never sees (or can open) a template they don't own.
 *
 * Takes `sites` as a param rather than fetching them itself — SessionProvider
 * already loads every site once at app start and keeps it in context, so
 * callers (ThemesGrid) should pass that instead of re-fetching /sites on
 * every visit to the page. */
export async function listOwnedTemplateKeys(
  sites: SiteOut[],
): Promise<Set<string>> {
  const templates = await listTemplates();
  const byId = new Map(templates.map((t) => [t.id, t.key]));
  return new Set(
    sites
      .map((s) => byId.get(s.template_id))
      .filter((key): key is string => !!key),
  );
}

export async function findSiteIdByTemplateKey(
  templateKey: string,
): Promise<string | null> {
  return (await findSiteByTemplateKey(templateKey))?.id ?? null;
}

/** The real theme currently stored for a site (what's actually live). */
export async function getSiteTheme(
  siteId: string,
): Promise<Record<string, unknown>> {
  const site = await request<SiteOut>(`/sites/${siteId}`);
  return site.theme;
}

/** Writes the editor's settings into `sites.theme`. No draft column on the
 * backend yet — this endpoint updates the live column directly. Does NOT by
 * itself take the site live — see publishSite for that (sites.status stays
 * "draft" until that's called too; use-publish-theme.ts calls both). */
export async function publishSiteTheme(
  siteId: string,
  theme: Record<string, unknown>,
): Promise<void> {
  await request(`/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify({ theme }),
  });
}

/** POST /sites/{id}/publish — the actual "go live" action: flips
 * sites.status to "published", publishes every page, and clears noindex.
 * Safe to call repeatedly (idempotent). Separate from publishSiteTheme
 * because they used to be conflated — writing the theme alone left the site
 * permanently in "draft" status, invisible to GET /public/site/{host} even
 * though the editor said "Published live". */
export async function publishSite(siteId: string): Promise<SiteOut> {
  return request<SiteOut>(`/sites/${siteId}/publish`, { method: "POST" });
}

export type MediaCategory = "hero" | "products" | "categories" | "other";

export type UploadedMedia = {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
};

/** Upload one image to this site's own Cloudinary folder (see app/media.py).
 * Bypasses the shared `request()` helper on purpose — that one always sets
 * Content-Type: application/json, which would break the multipart boundary
 * the browser needs to set itself for a file upload. */
export async function uploadSiteMedia(
  siteId: string,
  file: File,
  category: MediaCategory,
): Promise<UploadedMedia> {
  const token = getToken();
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(
    `${API_URL}/sites/${siteId}/media?category=${category}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<UploadedMedia>;
}

/** Previously uploaded images for this site+category, so the picker can show
 * past uploads without them ever being written to our own database. */
export async function listSiteMedia(
  siteId: string,
  category: MediaCategory,
): Promise<UploadedMedia[]> {
  return request<UploadedMedia[]>(
    `/sites/${siteId}/media?category=${category}`,
  );
}

export type MediaImage = {
  url: string;
  public_id: string;
  category: MediaCategory;
  created_at: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  /** True if a product/category/theme field currently points at this URL —
   * see app/api/media.py's _referenced_urls. Deleting an in-use image
   * leaves that spot blank on the live site rather than erroring, so the
   * gallery warns before letting you do it, it doesn't block it. */
  in_use: boolean;
};

export type MediaGallery = {
  images: MediaImage[];
  total_count: number;
  total_bytes: number;
  by_category: Record<MediaCategory, { count: number; bytes: number }>;
  /** Real per-plan storage ceiling for this site — see app/media.py's
   * PLAN_STORAGE_LIMIT_BYTES. Not a display-only placeholder; uploads
   * that would exceed it are rejected server-side (app/api/media.py). */
  limit_bytes: number;
  plan: string;
};

/** Every uploaded image across all four categories, with size/dimensions and
 * whether each is still referenced anywhere on the site — powers the Media
 * settings gallery. */
export async function listAllSiteMedia(siteId: string): Promise<MediaGallery> {
  return request<MediaGallery>(`/sites/${siteId}/media/all`);
}

/** Deletes one uploaded file outright — the merchant's own explicit choice
 * from the Media gallery, not the automatic per-save cleanup (commerce.py /
 * sites.py) or the cleanup sweep below. */
export async function deleteSiteMedia(siteId: string, publicId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/media/${encodeURIComponent(publicId)}`, {
    method: "DELETE",
  });
}

export type MediaCleanupResult = {
  checked: number;
  deleted: number;
  deleted_urls: string[];
};

/** Deletes every uploaded image nothing in the site currently references
 * (product/category images, theme logo/hero/testimonial photos) and that's
 * older than 24h — see app/api/media.py's cleanup_media for why that grace
 * window exists. Removing/replacing an image now cleans up automatically as
 * it happens; this is the catch-up sweep for anything uploaded before that
 * existed, or missed for any other reason. */
export async function cleanupSiteMedia(siteId: string): Promise<MediaCleanupResult> {
  return request<MediaCleanupResult>(`/sites/${siteId}/media/cleanup`, {
    method: "POST",
  });
}
