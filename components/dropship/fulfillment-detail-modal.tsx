"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { FulfillmentRequest, FulfillmentStatus } from "@/lib/dropship-mock";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";

type FulfillmentDetailModalProps = {
  request: FulfillmentRequest | null;
  onClose: () => void;
  onStatusChange: (id: string, status: FulfillmentStatus) => void;
};

/** Shipping details for a dropship order a reseller's customer placed —
 * everything the supplier needs to actually pack and ship it themselves.
 * Deliberately does NOT show the reseller's retail price anywhere the
 * supplier can see it by default — only the wholesale amount they're
 * earning — matching the "supplier never sees the markup" design decision
 * from the product discussion this feature is based on. */
export function FulfillmentDetailModal({
  request,
  onClose,
  onStatusChange,
}: FulfillmentDetailModalProps) {
  return (
    <AnimatePresence>
      {request ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fulfillment-detail-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="min-w-0">
                <h3 id="fulfillment-detail-title" className="truncate text-base font-semibold text-foreground">
                  {request.orderNumber}
                </h3>
                <p className="mt-0.5 text-sm text-muted">from {request.resellerName}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="flex items-center justify-between">
                <FulfillmentStatusBadge status={request.status} />
                <span className="text-xs text-muted">
                  {formatDisplayDate(new Date(request.createdAt))}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-soft">Product</p>
                <p className="mt-0.5 text-sm text-foreground">
                  {request.productName} × {request.quantity}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-soft">Ship to</p>
                  <p className="mt-0.5 text-sm text-foreground">{request.customerName}</p>
                  <p className="text-sm text-muted">{request.customerPhone}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                    {request.customerAddress}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-border bg-search-bg px-3 py-2.5">
                <p className="text-xs font-medium text-muted-soft">You earn</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                  {formatTaka(request.wholesalePriceCents / 100)}
                </p>
              </div>

              {request.status === "pending" ? (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onStatusChange(request.id, "shipped")}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Mark shipped
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange(request.id, "cancelled")}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-search-bg"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
