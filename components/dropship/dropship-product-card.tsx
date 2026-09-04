import { ImageOff, Users } from "lucide-react";
import type { ReactNode } from "react";
import { formatTaka } from "@/lib/format";

type DropshipProductCardProps = {
  image: string | null;
  title: string;
  supplierName: string;
  /** Main price shown large — wholesale on Browse/My Listings, retail on
   * Imported Products (each view passes what matters most to it). */
  priceLabel: string;
  priceCents: number;
  /** Smaller secondary line under the price, e.g. stock count or margin. */
  meta?: ReactNode;
  /** Store names currently reselling this — supplier-facing only, see
   * SupplierListing.resellers' own comment. */
  resellers?: string[];
  footer?: ReactNode;
  badge?: ReactNode;
};

/** Shared card shape for every dropship product grid (Browse Suppliers, My
 * Listings, Imported Products) — image on top like a real product card,
 * price and supplier info below, matching how a merchant already scans a
 * storefront rather than a spreadsheet-style table. */
export function DropshipProductCard({
  image,
  title,
  supplierName,
  priceLabel,
  priceCents,
  meta,
  resellers,
  footer,
  badge,
}: DropshipProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border dark:ring-transparent">
      <div className="relative aspect-[4/3] w-full shrink-0 bg-search-bg">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff className="size-6 text-muted-soft" strokeWidth={1.5} />
          </div>
        )}
        {badge ? <div className="absolute top-2.5 right-2.5">{badge}</div> : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">{supplierName}</p>
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted-soft">{priceLabel}</p>
          <p className="text-base font-semibold tabular-nums text-foreground">
            {formatTaka(priceCents / 100)}
          </p>
          {meta ? <div className="mt-0.5 text-xs">{meta}</div> : null}
        </div>

        {resellers && resellers.length > 0 ? (
          <div className="flex items-start gap-1.5 rounded-md bg-search-bg px-2.5 py-2 text-xs text-muted">
            <Users className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
            <span>
              Resold by {resellers.slice(0, 2).join(", ")}
              {resellers.length > 2 ? ` +${resellers.length - 2} more` : ""}
            </span>
          </div>
        ) : null}

        {footer ? <div className="mt-auto pt-1">{footer}</div> : null}
      </div>
    </article>
  );
}
