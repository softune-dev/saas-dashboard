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
};

/** Soft display cap for the storage ring until plan quotas ship on the API.
 * Ring fills against this; label still shows the real used bytes. */
const MEDIA_SOFT_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

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
export function ShopInfoPanel({ productsCount, categoriesCount }: ShopInfoPanelProps) {
  const { currentSite } = useSession();
  const siteId = currentSite?.id ?? null;

  const { data: templates } = useSWR("templates", listTemplates);
  const { data: media } = useSWR(siteId ? [siteId, "media-all"] : null, ([id]) =>
    listAllSiteMedia(id),
  );

  const templateKey = templates?.find((t) => t.id === currentSite?.template_id)?.key;
  const theme = templateKey ? getThemeById(templateKey) : undefined;
  const host = currentSite?.custom_domain || currentSite?.subdomain;
  const shopUrl = theme?.previewUrl && host ? `${theme.previewUrl}?__site=${host}` : null;
  const logoUrl = resolveSiteLogoUrl(currentSite);
  const usedBytes = media?.total_bytes ?? 0;

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
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600",
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
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white hover:text-primary"
          >
            <ArrowUpRight className="size-4" strokeWidth={2} />
          </a>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-md bg-search-bg p-3.5">
        <StorageProgressRing
          usedBytes={usedBytes}
          limitBytes={MEDIA_SOFT_LIMIT_BYTES}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {media ? formatBytes(usedBytes) : "—"}
          </p>
          <p className="text-xs text-muted">
            of {formatBytes(MEDIA_SOFT_LIMIT_BYTES)} media storage
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
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted"
                  strokeWidth={2}
                  aria-hidden
                />
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
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted"
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/products"
              className="flex flex-col justify-center gap-0.5 rounded-md bg-search-bg p-3.5 transition-colors hover:opacity-90"
            >
              <span className="text-xl font-semibold text-foreground">{productsCount}</span>
              <span className="text-xs text-muted">Products</span>
            </Link>
            <Link
              href="/categories"
              className="flex flex-col justify-center gap-0.5 rounded-md bg-search-bg p-3.5 transition-colors hover:opacity-90"
            >
              <span className="text-xl font-semibold text-foreground">{categoriesCount}</span>
              <span className="text-xs text-muted">Categories</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
