"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { AbandonedCheckoutOut } from "@/lib/api/customers";
import { WhatsAppIcon } from "@/components/dropship/whatsapp-icon";

/** Bangladeshi mobile number -> wa.me's expected digits-only format. The
 * captured phone is stored normalized (last 10 digits, no leading 0 — see
 * crud.normalize_phone), so this just re-adds the country code. */
function toWaLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (!/^1[3-9]\d{8}$/.test(digits)) return null;
  return `https://wa.me/880${digits}`;
}

type AbandonedCheckoutsSectionProps = {
  checkouts: AbandonedCheckoutOut[];
};

/** Shoppers who entered a phone during checkout but never placed the
 * order — data only, no automated reminder. A merchant sees who to follow
 * up with and can reach out themselves (WhatsApp link included since
 * that's the fastest way to actually reach a BD shopper). */
export function AbandonedCheckoutsSection({ checkouts }: AbandonedCheckoutsSectionProps) {
  const { t } = useLanguage();

  if (checkouts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {t("Abandoned Checkouts")}
        </h2>
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
          {checkouts.length}
        </span>
      </div>
      <p className="mb-4 text-xs text-muted">
        {t("Started checkout but never placed the order. Reach out yourself — there's no automated reminder yet.")}
      </p>

      <div className="flex flex-col divide-y divide-border">
        {checkouts.map((c) => {
          const waLink = toWaLink(c.phone);
          const itemsLabel = c.items
            .map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`)
            .join(", ");
          return (
            <div key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{c.phone}</p>
                <p className="truncate text-xs text-muted" title={itemsLabel}>
                  {itemsLabel}
                </p>
                <p className="mt-0.5 text-xs text-muted-soft">
                  {t("Last seen")} {formatDisplayDate(new Date(c.updated_at))}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatTaka(c.subtotal_cents / 100)}
                </span>
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Contact on WhatsApp"
                    title="Contact on WhatsApp"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-soft transition-colors hover:bg-search-bg hover:text-foreground"
                  >
                    <WhatsAppIcon className="size-4 text-[#25D366]" />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
