"use client";

import { AnimatePresence, motion } from "motion/react";
import { CreditCard, Globe, ImageOff, MapPin, Printer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSelect } from "@/components/settings/site/ui/settings-field";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import type { FulfillmentRequest, FulfillmentStatus } from "@/lib/dropship-mock";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";

type FulfillmentDetailModalProps = {
  request: FulfillmentRequest | null;
  onClose: () => void;
  onStatusChange: (id: string, status: FulfillmentStatus) => void;
};

const STATUS_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
];

/** Full order detail for a dropship fulfillment request — same shape as the
 * main Orders page's detail modal (header, customer, payment, products,
 * status control), plus the one thing that page doesn't need: which
 * reseller's storefront this order actually came from. Deliberately does
 * NOT show the reseller's retail price — only the wholesale amount the
 * supplier earns — matching the "supplier never sees the markup" decision
 * from the product discussion this feature is based on. */
export function FulfillmentDetailModal({
  request,
  onClose,
  onStatusChange,
}: FulfillmentDetailModalProps) {
  const [status, setStatus] = useState<FulfillmentStatus>(request?.status ?? "pending");

  useEffect(() => {
    if (request) setStatus(request.status);
  }, [request?.id, request?.status]);

  const dirty = request ? status !== request.status : false;

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
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 bg-primary/5 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    id="fulfillment-detail-title"
                    className="truncate text-base font-semibold text-foreground"
                  >
                    {request.orderNumber}
                  </h3>
                  <FulfillmentStatusBadge status={request.status} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {formatDisplayDate(new Date(request.createdAt))} · {request.quantity} item
                  {request.quantity === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Print"
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
                >
                  <Printer className="size-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="rounded-md border border-border px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-soft">
                  <Globe className="size-3.5" strokeWidth={1.75} />
                  Sold on
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{request.resellerName}</p>
                <p className="truncate text-xs text-muted">{request.resellerDomain}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-soft">
                    <MapPin className="size-3.5" strokeWidth={1.75} />
                    Ship to
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">{request.customerName}</p>
                  <p className="text-sm text-muted">{request.customerPhone}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground">
                    {request.customerAddress}
                  </p>
                </div>
                <div className="rounded-md border border-border px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-soft">
                    <CreditCard className="size-3.5" strokeWidth={1.75} />
                    Payment
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">{request.paymentMethod}</p>
                  <p className="mt-2 text-xs font-medium text-muted-soft">You earn</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatTaka(request.wholesalePriceCents / 100)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-soft">Product</p>
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg">
                    {request.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.productImage}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageOff className="size-4 text-muted-soft" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{request.productName}</p>
                    <p className="text-xs text-muted">Qty {request.quantity}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 border-t border-border pt-4">
                <div className="flex-1">
                  <SettingsSelect
                    label="Order status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FulfillmentStatus)}
                    options={STATUS_OPTIONS}
                  />
                </div>
                {dirty ? (
                  <button
                    type="button"
                    onClick={() => onStatusChange(request.id, status)}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Update
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
