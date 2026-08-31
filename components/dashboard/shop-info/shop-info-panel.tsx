"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import useSWR from "swr";
import { useSession } from "@/components/providers/session-provider";
import { getThemeById } from "@/components/themes/themes-data";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  listAllSiteMedia,
  listTemplates,
  resolveSiteLogoUrl,
} from "@/lib/api";
import { formatBytes } from "@/lib/format";

type ShopInfoPanelProps = {
  productsCount: number;
  categoriesCount: number;
  /** Up to 3 product thumbnail URLs for the Products tile stack. */
  productImages?: string[];
  /** Up to 3 category image URLs for the Categories tile stack. */
  categoryImages?: string[];
};

const STACK_ROTATIONS = [-8, 5, 14] as const;

/** Fanned stack of real thumbnails — only as many frames as real URLs. */
function ImageStack({ urls, label }: { urls: string[]; label: string }) {
  const shown = urls.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <span
      className="relative isolate h-10 w-[3.35rem] shrink-0"
      aria-hidden
    >
      {shown.map((url, i) => (
        <span
          key={`${url}-${i}`}
          className="absolute top-0 left-0 size-10 overflow-hidden rounded-md bg-surface shadow-sm ring-1 ring-black/10"
          style={{
            zIndex: shown.length - i,
            transform: `translateX(${i * 5}px) rotate(${STACK_ROTATIONS[i] ?? 0}deg)`,
          }}
        >
          <Image
            src={url}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
            sizes="40px"
            unoptimized
          />
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Products / Categories summary tile — photo stack when images exist,
 * otherwise the plain count + label so empty media doesn't leave a blank card. */
function CountTile({
  href,
  count,
  label,
  images,
}: {
  href: string;
  count: number;
  label: string;
  images: string[];
}) {
  const hasStack = images.length > 0;

  return (
    <Link
      href={href}
      aria-label={`${label} (${count})`}
      className="flex items-center justify-between gap-2 rounded-md bg-search-bg p-3.5 transition-colors hover:opacity-90"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {hasStack ? <ImageStack urls={images} label={label} /> : null}
        <span className="flex min-w-0 flex-col justify-center gap-0.5">
          <span className="text-xl font-semibold text-foreground">{count}</span>
          <span className="text-xs text-muted">{label}</span>
        </span>
      </span>
    </Link>
  );
}

/** Circular used/limit progress — thick primary ring, rounded ends, no label. */
function StorageProgressRing({
  usedBytes,
  limitBytes,
}: {
  usedBytes: number;
  limitBytes: number;
}) {
  const size = 36;
  const stroke = 5.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct =
    limitBytes > 0 ? Math.min(1, Math.max(0, usedBytes / limitBytes)) : 0;
  const offset = c * (1 - pct);

  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
    </span>
  );
}

/** Shop avatar: real logo from DB when set, else blue circle + shop-bag
 * (matches the header store pill). */
function ShopAvatar({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  if (logoUrl) {
    // Logos are rarely 1:1 — contain + inset keeps the full mark inside the
    // circle instead of cropping with object-cover.
    return (
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-black/5">
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-contain p-1.5"
          sizes="36px"
          unoptimized
        />
      </span>
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-store text-white">
      <MaskIcon src="/sidebar/shop-bag.svg" className="size-4" />
    </span>
  );
}

/** Replaces the old "Top Selling Product" pie (which only ever showed static
 * placeholder data — there was no real per-product sales breakdown to chart)
 * with a quick at-a-glance panel about the shop itself: the live storefront
 * link, real Cloudinary storage usage, and either quick-start actions for a
 * brand-new empty site or a compact product/category summary once there's
 * real content. Every row shows real data or a real action — nothing here is
 * decorative filler. */
export function ShopInfoPanel({
  productsCount,
  categoriesCount,
  productImages = [],
  categoryImages = [],
}: ShopInfoPanelProps) {
  const { currentSite } = useSession();
  const siteId = currentSite?.id ?? null;

  const { data: templates } = useSWR("templates", listTemplates);
  const { data: media } = useSWR(siteId ? [siteId, "media-all"] : null, ([id]) =>
    listAllSiteMedia(id),
  );

  const templateKey = templates?.find((t) => t.id === currentSite?.template_id)?.key;
  const theme = templateKey ? getThemeById(templateKey) : undefined;
  const host = currentSite?.custom_domain || currentSite?.subdomain;
  // A published site already has a real domain attached (custom_domain, or
  // {subdomain}.SITE_BASE_DOMAIN via the Vercel API automation on publish —
  // see app/api/sites.py's publish_site) — link there directly instead of
  // the shared template preview server. A draft has no real domain yet
  // (that's what publishing does), so it falls back to the same
  // preview-with-?__site= mechanism the theme editor uses.
  const siteBaseDomain = process.env.NEXT_PUBLIC_SITE_BASE_DOMAIN || "softunebd.com";
  const realShopUrl =
    currentSite?.status === "published" && host
      ? `https://${host.includes(".") ? host : `${host}.${siteBaseDomain}`}`
      : null;
  const shopUrl =
    realShopUrl ?? (theme?.previewUrl && host ? `${theme.previewUrl}?__site=${host}` : null);
  const logoUrl = resolveSiteLogoUrl(currentSite);
  const usedBytes = media?.total_bytes ?? 0;
  // Real per-plan ceiling from the backend (app/media.py's
  // PLAN_STORAGE_LIMIT_BYTES) — falls back to Starter's limit only for the
  // brief window before the first fetch resolves, never shown as final.
  const limitBytes = media?.limit_bytes ?? 500 * 1024 * 1024;

  const isEmpty = productsCount === 0 && categoriesCount === 0;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">My Shop</h2>
        {currentSite ? (
          <span
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium",
              currentSite.status === "published"
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-600",
            ].join(" ")}
          >
            {currentSite.status === "published" ? "Live" : "Draft"}
          </span>
        ) : null}
      </div>

      {/* Inner cards: same rounded-md as the white panel; page background fill */}
      <div className="flex items-center gap-3 rounded-md bg-search-bg p-3.5">
        <ShopAvatar
          logoUrl={logoUrl}
          name={currentSite?.name ?? "Your site"}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {currentSite?.name ?? "Your site"}
          </p>
          <p className="truncate text-xs text-muted">{host ?? "No domain yet"}</p>
        </div>
        {shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open shop in a new tab"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-primary"
          >
            <ArrowUpRight className="size-4" strokeWidth={2} />
          </a>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-md bg-search-bg p-3.5">
        <Image 
          src="/others/open-folder.webp" 
          alt="Folder" 
          width={36} 
          height={36} 
          className="shrink-0 object-contain drop-shadow-sm"
        />
        <StorageProgressRing
          usedBytes={usedBytes}
          limitBytes={limitBytes}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {media ? formatBytes(usedBytes) : "—"}
          </p>
          <p className="text-xs text-muted">
            of {formatBytes(limitBytes)} storage
          </p>
        </div>
        <Link
          href="/settings/site/media"
          className="shrink-0 text-xs font-medium text-muted transition-colors hover:underline"
        >
          Manage
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        {isEmpty ? (
          <>
            <Link
              href="/products/new"
              className="flex flex-col justify-center gap-2 rounded-md bg-search-bg p-3.5 transition-colors hover:bg-primary/5"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
                <MaskIcon src="/sidebar/plus.svg" className="size-4" />
              </span>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  Add product
                </span>
              </span>
            </Link>
            <Link
              href="/categories"
              className="flex flex-col justify-center gap-2 rounded-md bg-search-bg p-3.5 transition-colors hover:bg-primary/5"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
                <MaskIcon src="/sidebar/plus.svg" className="size-4" />
              </span>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  Add category
                </span>
              </span>
            </Link>
          </>
        ) : (
          <>
            <CountTile
              href="/products"
              count={productsCount}
              label="Products"
              images={productImages}
            />
            <CountTile
              href="/categories"
              count={categoriesCount}
              label="Categories"
              images={categoryImages}
            />
          </>
        )}
      </div>
    </div>
  );
}
