"use client";

import { useEffect, useState } from "react";
import { Download, Receipt } from "lucide-react";
import { listInvoices, type InvoiceOut } from "@/lib/api";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import { planById } from "./billing-data";

/** Real invoices, event-triggered (trial start, or a manual plan change by
 * the team) — not a recurring billing cycle, since there's no subscription
 * gateway wired up yet. See app/api/billing.py. */
export function BillingHistory() {
  const [invoices, setInvoices] = useState<InvoiceOut[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInvoices()
      .then((page) => {
        if (!cancelled) setInvoices(page.items);
      })
      .catch(() => {
        if (!cancelled) setInvoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Billing history
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Invoices and past subscription charges
        </p>
      </div>

      {invoices === null ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-search-bg" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-search-bg text-muted-soft">
            <Receipt className="size-4" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-foreground">No invoices yet</p>
          <p className="max-w-xs text-xs text-muted">
            An invoice shows up here once your trial starts or your plan changes.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {inv.invoice_number}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {planById(inv.plan)?.name ?? (inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1))} ·{" "}
                  {inv.period_label} ·{" "}
                  {formatDisplayDate(new Date(inv.issued_at))}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatTaka(inv.amount_cents / 100)}
                </span>
                {inv.pdf_url ? (
                  <a
                    href={inv.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Download invoice ${inv.invoice_number}`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
                  >
                    <Download className="size-4" strokeWidth={1.75} />
                  </a>
                ) : (
                  <span className="text-xs text-muted-soft">Generating…</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
