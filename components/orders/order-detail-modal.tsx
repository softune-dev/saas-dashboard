"use client";

import { Check, ImageOff, Package, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { formatDisplayDate, formatTaka } from "@/lib/format";
import {
  customerAddress,
  customerEmail,
  customerName,
  customerPhone,
} from "@/lib/order-customer";
import {
  listProducts,
  type OrderItemOut,
  type OrderOut,
  type OrderStatus,
  type ProductOut,
} from "@/lib/api/commerce";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "./order-status-badge";

type OrderDetailModalProps = {
  open: boolean;
  order: OrderOut | null;
  busy?: boolean;
  onClose: () => void;
  onStatusChange: (order: OrderOut, status: OrderStatus) => Promise<void>;
};

function ItemThumb({
  item,
  productById,
}: {
  item: OrderItemOut;
  productById: Map<string, ProductOut>;
}) {
  const url =
    item.product_id != null
      ? productById.get(item.product_id)?.images?.[0]?.url
      : undefined;

  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-search-bg">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-soft" strokeWidth={1.5} />
      )}
    </span>
  );
}

const FLOW: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "fulfilled", label: "Fulfilled" },
];

function StatusSteps({ status }: { status: OrderStatus }) {
  const isTerminal = status === "cancelled" || status === "refunded";
  const activeIdx = FLOW.findIndex((s) => s.key === status);

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={status} />
        <span className="text-sm text-muted">
          {status === "cancelled"
            ? "This order was cancelled."
            : "This order was refunded."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start">
      {FLOW.map((step, i) => {
        const done = activeIdx > i;
        const current = activeIdx === i;
        const reached = done || current;
        const segmentFilled = activeIdx > i;
        const isLast = i === FLOW.length - 1;

        return (
          <div
            key={step.key}
            className={[
              "flex items-start",
              isLast ? "shrink-0" : "min-w-0 flex-1",
            ].join(" ")}
          >
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <span
                className={[
                  "flex size-7 items-center justify-center rounded-full text-[11px] font-semibold",
                  reached
                    ? "bg-primary text-white"
                    : "border border-slate-200 bg-white text-muted-soft",
                ].join(" ")}
              >
                {done ? (
                  <Check className="size-3.5" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={[
                  "text-[11px] font-medium whitespace-nowrap",
                  current
                    ? "text-primary"
                    : reached
                      ? "text-foreground"
                      : "text-muted-soft",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className="mx-2 mt-3 h-px min-w-[1rem] flex-1 bg-slate-200"
                aria-hidden
              >
                <div
                  className={[
                    "h-full transition-all duration-300",
                    segmentFilled ? "w-full bg-primary" : "w-0 bg-primary",
                  ].join(" ")}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Flat, simple order detail. Status control sits beside customer info. */
export function OrderDetailModal({
  open,
  order,
  busy,
  onClose,
  onStatusChange,
}: OrderDetailModalProps) {
  const { currentSite } = useSession();
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);
  const [products, setProducts] = useState<ProductOut[]>([]);

  useEffect(() => {
    setLocalStatus(null);
  }, [order?.id]);

  useEffect(() => {
    if (!open || !currentSite) return;
    let cancelled = false;
    (async () => {
      try {
        const page = await listProducts(currentSite.id, { limit: 100 });
        if (!cancelled) setProducts(page.items);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, currentSite]);

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const status = localStatus ?? order?.status ?? "pending";
  const statusDirty = order ? status !== order.status : false;

  if (!order && !open) return null;

  const name = order ? customerName(order.customer) : "";
  const email = order ? customerEmail(order.customer) : "";
  const phone = order ? customerPhone(order.customer) : "";
  const address = order ? customerAddress(order.customer) : "";
  const itemCount = order
    ? order.items.reduce((n, i) => n + i.quantity, 0)
    : 0;

  return (
    <AnimatePresence>
      {open && order ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={busy ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="order-detail-title"
                    className="text-base font-semibold text-foreground"
                  >
                    {order.order_number}
                  </h3>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatDisplayDate(new Date(order.created_at))}
                  <span className="mx-1.5 text-muted-soft">·</span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={busy}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg disabled:opacity-60"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Progress */}
              <div>
                <p className="mb-3 text-xs font-medium text-muted">Progress</p>
                <StatusSteps status={order.status} />
              </div>

              {/* Customer + status side by side */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-xs font-medium text-muted">Customer</p>
                  <p className="font-medium text-foreground">{name}</p>
                  {email ? (
                    <p className="mt-0.5 text-sm text-muted">{email}</p>
                  ) : null}
                  {phone ? (
                    <p className="mt-0.5 text-sm text-muted">{phone}</p>
                  ) : null}
                  {!email && !phone ? (
                    <p className="mt-0.5 text-sm text-muted-soft">
                      No contact details
                    </p>
                  ) : null}
                </div>

                <div className="w-full shrink-0 sm:w-44">
                  <label
                    htmlFor="order-status"
                    className="mb-2 block text-xs font-medium text-muted"
                  >
                    Change status
                  </label>
                  <div className="flex flex-col gap-2">
                    <select
                      id="order-status"
                      aria-label="Order status"
                      value={status}
                      disabled={busy}
                      onChange={(e) => {
                        setLocalStatus(e.target.value as OrderStatus);
                      }}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                    >
                      {ORDER_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {statusDirty ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          await onStatusChange(order, status);
                          setLocalStatus(null);
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {busy ? "Saving…" : "Update"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {address ? (
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-1.5 text-xs font-medium text-muted">
                    Shipping address
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {address}
                  </p>
                </div>
              ) : null}

              {order.meta?.payment_method ? (
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-1.5 text-xs font-medium text-muted">Payment</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {order.meta.payment_method === "manual"
                      ? "Manual payment"
                      : order.meta.payment_method === "cod"
                        ? "Cash on Delivery"
                        : order.meta.payment_method}
                  </p>
                  {order.meta.transaction_id ? (
                    <p className="mt-0.5 text-sm text-muted">
                      Transaction ID:{" "}
                      <span className="font-mono text-foreground">
                        {order.meta.transaction_id}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {order.notes ? (
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-1.5 text-xs font-medium text-muted">Notes</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {order.notes}
                  </p>
                </div>
              ) : null}

              {/* Products */}
              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3 text-xs font-medium text-muted">
                  Products ordered
                </p>
                {order.items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted">
                    <Package className="size-5 text-muted-soft" strokeWidth={1.5} />
                    <p className="text-sm">No products on this order.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <ItemThumb item={item} productById={productById} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.name_snapshot}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {item.sku_snapshot ? (
                              <span className="mr-1.5">
                                SKU {item.sku_snapshot}
                              </span>
                            ) : null}
                            <span className="tabular-nums">
                              {formatTaka(item.unit_price_cents / 100)} ×{" "}
                              {item.quantity}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                          {formatTaka(item.total_cents / 100)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">
                    {formatTaka(order.subtotal_cents / 100)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {formatTaka(order.shipping_cents / 100)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span className="tabular-nums">
                    {formatTaka(order.tax_cents / 100)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-[15px] font-semibold text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatTaka(order.total_cents / 100)}
                    <span className="ml-1 text-xs font-normal text-muted">
                      {order.currency}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
