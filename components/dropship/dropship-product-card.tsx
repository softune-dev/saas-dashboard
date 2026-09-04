import { ImageOff, Truck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { formatTaka } from "@/lib/format";
import type { DeliveryLocation } from "@/lib/dropship-mock";

const SHORT_LOCATION: Record<DeliveryLocation, string> = {
  "Inside Dhaka": "Dhaka",
  "Outside Dhaka": "Outside",
};

/** Same 60% suggested markup the Import modal defaults to — shown here so
 * a reseller can gauge margin while still browsing, not only after opening
 * Import. */
const SUGGESTED_MARKUP = 1.6;

type DropshipProductCardProps = {
  image: string | null;
  title: string;
  supplierName: string;
  wholesalePriceCents: number;
  stock: number;
  deliveryLocations?: DeliveryLocation[];
  deliveryFeeCents?: Partial<Record<DeliveryLocation, number>>;
  outOfStock?: boolean;
  /** Store names currently reselling this — supplier-facing only, see
   * SupplierListing.resellers' own comment. */
  resellers?: string[];
  footer?: ReactNode;
  badge?: ReactNode;
  /** Makes the image + title area clickable — opens a detail view. Footer
   * stays its own click target (e.g. Import/Remove), never triggers this. */
  onClick?: () => void;
};

/** Shared card shape for every dropship product grid (Browse Products, My
 * Listings, Supplier profile) — image on top, then wholesale price against
 * a suggested resell price, stock against margin, and delivery coverage —
 * the numbers a reseller actually needs to decide whether this is worth
 * importing, not just a single price. */
export function DropshipProductCard({
  image,
  title,
  supplierName,
  wholesalePriceCents,
  stock,
  deliveryLocations,
  deliveryFeeCents,
  outOfStock,
  resellers,
  footer,
  badge,
  onClick,
}: DropshipProductCardProps) {
  const suggestedResellCents = Math.round(wholesalePriceCents * SUGGESTED_MARKUP);
  const marginCents = suggestedResellCents - wholesalePriceCents;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={[
          "flex flex-col text-left",
          onClick ? "cursor-pointer transition-opacity hover:opacity-90" : "cursor-default",
        ].join(" ")}
      >
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

        <div className="flex flex-col gap-2.5 p-4 pb-0">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted">{supplierName}</p>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-muted-soft">Wholesale price</p>
              <p className="text-base font-semibold tabular-nums text-foreground">
                {formatTaka(wholesalePriceCents / 100)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-muted-soft">Suggested resell</p>
              <p className="text-base font-semibold tabular-nums text-foreground">
                {formatTaka(suggestedResellCents / 100)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            {outOfStock ? (
              <span className="font-medium text-rose-600">Out of stock</span>
            ) : (
              <span className="text-muted">{stock} in stock</span>
            )}
            <span className="font-medium text-emerald-600">
              +{formatTaka(marginCents / 100)} margin
            </span>
          </div>

          {deliveryLocations && deliveryLocations.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">
                {deliveryLocations
                  .map((loc) => {
                    const fee = deliveryFeeCents?.[loc];
                    return fee != null
                      ? `${SHORT_LOCATION[loc]} ৳${Math.round(fee / 100)}`
                      : SHORT_LOCATION[loc];
                  })
                  .join(" · ")}
              </span>
            </div>
          ) : null}

          {resellers && resellers.length > 0 ? (
            <div className="flex items-start gap-1.5 rounded-md bg-search-bg px-2.5 py-2 text-xs text-muted">
              <Users className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
              <span>
                Resold by {resellers.slice(0, 2).join(", ")}
                {resellers.length > 2 ? ` +${resellers.length - 2} more` : ""}
              </span>
            </div>
          ) : null}
        </div>
      </button>

      {footer ? <div className="px-4 pt-3 pb-4">{footer}</div> : null}
    </article>
  );
}
