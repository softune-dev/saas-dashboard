/**
 * Site Settings — SEO, Contact/business info, Shipping locations, FAQs, and
 * legal pages (Privacy/Terms). All live in JSONB columns on `sites`
 * (business/seo already existed; shipping/faqs/legal added in migration
 * 015_site_settings.sql) and are all written through the same
 * `PATCH /sites/{id}` endpoint app/api/sites.py already exposes — this
 * module is just typed shapes over that one endpoint, one function per
 * section so each settings page only sends the key it actually changed.
 *
 * Shapes here must match what app/api/public.py's _resolve_seo/_json_ld
 * actually read (see that file) — a field renamed here without renaming it
 * there silently stops working on the live storefront.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

export type SiteSeo = {
  title_suffix?: string;
  meta_description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  favicon?: string;
  noindex?: boolean;
  sitemap_enabled?: boolean;
  google_analytics?: string;
  google_search_console?: string;
  facebook_pixel?: string;
  tiktok_pixel?: string;
  gtm_container_id?: string;
};

export type BusinessHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type SiteBusiness = {
  name?: string;
  type?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  logo_url?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  map_url?: string;
  hours?: BusinessHour[];
  /** Formatted "Day HH:MM-HH:MM" strings, computed from `hours` on save —
   * this is the shape app/api/public.py's _json_ld passes straight through
   * as schema.org openingHours. */
  opening_hours?: string[];
  socials?: Record<string, string>;
  support_note?: string;
};

export type ShippingLocation = {
  id: string;
  name: string;
  charge_cents: number;
};

export type SiteShipping = {
  locations: ShippingLocation[];
};

/** Dedicated About Us page content — separate from theme.tagline (short
 * strapline shown site-wide) and business.description (one-line SEO/contact
 * blurb). This is the merchant's longer-form story, with its own image
 * rather than reusing the homepage hero. */
export type SiteAbout = {
  heading?: string;
  image?: string;
  paragraphs?: string[];
};

export type SiteFaq = {
  id: string;
  question: string;
  answer: string;
};

export type LegalDoc = {
  title: string;
  content: string;
  published: boolean;
};

export type SiteLegal = {
  privacy?: LegalDoc;
  terms?: LegalDoc;
};

/** Checkout rules evaluated against the CURRENT order only — see
 * dashboard/components/fraud/fraud-data.ts's FraudRuleId/FraudRuleState for
 * the exact keys/shape this mirrors. Untyped Record here (rather than a
 * fixed set of keys) since the rule catalog lives in the component, not
 * this API layer — keeps them from drifting out of sync in two places. */
export type SiteFraudRules = Record<string, { enabled: boolean; value?: number }>;

export type SiteSettings = {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  business: SiteBusiness;
  about: SiteAbout;
  seo: SiteSeo;
  shipping: SiteShipping;
  faqs: SiteFaq[];
  legal: SiteLegal;
  fraud_rules: SiteFraudRules;
};

export async function getSiteSettings(siteId: string): Promise<SiteSettings> {
  return request<SiteSettings>(`/sites/${siteId}`);
}

export function useSiteSettingsSWR(
  siteId: string | null,
): SWRResponse<SiteSettings> {
  return useSWR(siteId ? [siteId, "site-settings"] : null, ([id]) =>
    getSiteSettings(id),
  );
}

type SiteSettingsPatch = Partial<
  Pick<SiteSettings, "business" | "about" | "seo" | "shipping" | "faqs" | "legal" | "fraud_rules">
>;

async function patchSite(siteId: string, patch: SiteSettingsPatch): Promise<SiteSettings> {
  return request<SiteSettings>(`/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export const saveSiteSeo = (siteId: string, seo: SiteSeo) => patchSite(siteId, { seo });
export const saveSiteBusiness = (siteId: string, business: SiteBusiness) =>
  patchSite(siteId, { business });
export const saveSiteAbout = (siteId: string, about: SiteAbout) =>
  patchSite(siteId, { about });
export const saveSiteShipping = (siteId: string, shipping: SiteShipping) =>
  patchSite(siteId, { shipping });
export const saveSiteFaqs = (siteId: string, faqs: SiteFaq[]) => patchSite(siteId, { faqs });
export const saveSiteLegal = (siteId: string, legal: SiteLegal) => patchSite(siteId, { legal });
export const saveSiteFraudRules = (siteId: string, fraud_rules: SiteFraudRules) =>
  patchSite(siteId, { fraud_rules });

/** Not routed through patchSite's typed subset above — custom_domain isn't
 * a settings-section field, it's site identity, but it's the same one
 * PATCH /sites/{id} endpoint underneath. Setting it (once the site is
 * published) queues the same Vercel domain-attach automation as publish —
 * see app/api/sites.py's update_site. */
export async function saveSiteDomain(
  siteId: string,
  custom_domain: string | null,
): Promise<SiteSettings> {
  return request<SiteSettings>(`/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify({ custom_domain }),
  });
}

export type DomainStatus = {
  domain: string;
  /** null = couldn't check (not a real "not connected") — see
   * app/vercel.py's check_domain_connected. */
  connected: boolean | null;
};

/** Real-time DNS check against Vercel — not cached, this is a live network
 * call on the backend, called on-demand (mount + manual refresh), not
 * polled continuously. */
export async function getDomainStatus(siteId: string): Promise<DomainStatus> {
  return request<DomainStatus>(`/sites/${siteId}/domain-status`);
}
