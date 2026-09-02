/** Public storefront host suffix — same fallback Site Settings uses. */
export const SITE_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softunebd.com";

/** Hostname merchants see in Site Settings: custom domain if set, otherwise
 * `{subdomain}.{SITE_BASE_DOMAIN}`. The `subdomain` column is only the slug. */
export function displayStorefrontHost(
  site:
    | { subdomain: string; custom_domain: string | null }
    | null
    | undefined,
): string | null {
  if (!site) return null;
  if (site.custom_domain) return site.custom_domain;
  if (!site.subdomain) return null;
  return `${site.subdomain}.${SITE_BASE_DOMAIN}`;
}

/** Whole days remaining until an ISO timestamp. Floors, never negative. */
export function trialDaysLeft(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Format a Date as "Aug 10, 2026" */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format number with locale separators */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** "2m ago" / "3h ago" / "5d ago", falling back to a short date past a week. */
export function formatRelativeTime(date: Date): string {
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDisplayDate(date);
}

/** Format BDT amount with ৳ */
export function formatTaka(value: number): string {
  return `${formatNumber(value)}৳`;
}

/** Format a byte count as "1.2 MB" / "340 KB" — for storage totals. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/** yyyy-mm-dd for native date inputs */
export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}
