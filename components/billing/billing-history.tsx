"use client";

import { Receipt } from "lucide-react";

/**
 * No invoicing/subscriptions table exists in the backend yet (billing is
 * applied manually by the team — see plan-cards.tsx / contact-sales-modal).
 * This shows an honest empty state instead of fabricated invoice rows;
 * wire this to a real GET /billing/invoices once that table exists.
 */
export function BillingHistory() {
  return (
    <section className="rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Billing history
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Invoices and past subscription charges
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-search-bg text-muted-soft">
          <Receipt className="size-4" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-medium text-foreground">No invoices yet</p>
        <p className="max-w-xs text-xs text-muted">
          Billing is set up manually with our team for now — invoices will
          show up here once your plan is active.
        </p>
      </div>
    </section>
  );
}
