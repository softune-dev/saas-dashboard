"use client";

import { AlertTriangle, CheckCircle2, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import {
  bulkBookOrdersCourier,
  type CourierBulkBookResult,
  type OrderStatus,
} from "@/lib/api/commerce";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
];

type BulkBookCourierModalProps = {
  open: boolean;
  siteId: string | null;
  onClose: () => void;
  /** Called after a successful (even partially successful) run, so the
   * caller can refresh the orders list — booked orders now carry a
   * courier_consignment_id the table/detail modal should show. */
  onBooked: () => void;
};

/** Books every unbooked storefront order matching a status + date-range
 * filter in one Steadfast bulk call (up to 500 at a time — see
 * app/api/commerce.py's bulk_book_orders_courier). Deliberately filter-
 * based rather than a row-checkbox picker: "book everything paid this
 * week" is closer to how a merchant actually thinks about a courier run
 * than selecting rows one at a time. */
export function BulkBookCourierModal({
  open,
  siteId,
  onClose,
  onBooked,
}: BulkBookCourierModalProps) {
  const [status, setStatus] = useState<OrderStatus | "">("paid");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CourierBulkBookResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await bulkBookOrdersCourier(siteId, {
        status: status || undefined,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
      });
      setResult(res);
      if (res.booked > 0) onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't book these orders.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal
      open={open}
      title="Bulk book with Steadfast"
      busy={busy}
      submitLabel={busy ? "Booking…" : "Book orders"}
      compact
      onClose={() => {
        reset();
        onClose();
      }}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Books every unbooked storefront order matching this filter, up to 500 at once. Already-
          booked orders are skipped automatically.
        </p>

        <label className="block">
          <span className="text-xs font-medium text-muted-soft">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
            className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-soft">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-soft">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-600">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        ) : null}

        {result ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <div>
              <p>
                Booked {result.booked} order{result.booked === 1 ? "" : "s"}
                {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 text-xs text-rose-600">
                  {result.errors.slice(0, 5).map((e) => (
                    <li key={e.order_number}>
                      {e.order_number}: {e.message}
                    </li>
                  ))}
                  {result.errors.length > 5 ? (
                    <li>+{result.errors.length - 5} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        ) : null}

        {!result && !error ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-soft">
            <Truck className="size-3.5 shrink-0" strokeWidth={1.75} />
            Leave the date range empty to book from every matching order, regardless of when it
            was placed.
          </div>
        ) : null}
      </div>
    </FormModal>
  );
}
