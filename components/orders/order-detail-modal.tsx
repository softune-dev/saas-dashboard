"use client";

import { ImageOff, Package, Printer, ShieldBan, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useMdUp } from "@/lib/hooks/use-md-up";
import { useSession } from "@/components/providers/session-provider";
import { SettingsSelect } from "@/components/settings/site/ui/settings-field";
import { useToast } from "@/components/ui/toast";
import { formatBdPhone, formatDisplayDate, formatTaka } from "@/lib/format";
import {
  customerAddress,
  customerEmail,
  customerName,
  customerPhone,
} from "@/lib/order-customer";
import {
  bookOrderCourier,
  listProducts,
  type OrderItemOut,
  type OrderOut,
  type OrderStatus,
  type ProductOut,
} from "@/lib/api/commerce";
import { addIpToBlocklist } from "@/lib/api/fraud";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "./order-status-badge";

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  in_review: "In review",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type OrderDetailModalProps = {
  open: boolean;
  order: OrderOut | null;
  busy?: boolean;
  onClose: () => void;
  onStatusChange: (order: OrderOut, status: OrderStatus) => Promise<void>;
  /** Called after a successful manual courier booking, so the caller can
   * update its own cached copy of this order (consignment_id etc. changed). */
  onCourierBooked?: (order: OrderOut) => void;
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


/** Flat, simple order detail. Status control sits beside customer info. */
export function OrderDetailModal({
  open,
  order,
  busy,
  onClose,
  onStatusChange,
  onCourierBooked,
}: OrderDetailModalProps) {
  const mdUp = useMdUp();
  const { currentSite } = useSession();
  const { toast } = useToast();
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [blockingIp, setBlockingIp] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLocalStatus(null);
    setIpBlocked(false);
  }, [order?.id]);

  async function handleBookCourier() {
    if (!currentSite || !order) return;
    setBooking(true);
    try {
      const updated = await bookOrderCourier(currentSite.id, order.id);
      onCourierBooked?.(updated);
      toast({
        title: "Booked with Steadfast",
        description: updated.courier_tracking_code
          ? `Tracking code ${updated.courier_tracking_code}`
          : undefined,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't book this order",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBooking(false);
    }
  }

  async function handleBlockIp() {
    if (!currentSite || !order?.ip_address) return;
    setBlockingIp(true);
    try {
      await addIpToBlocklist(currentSite.id, {
        ip_address: order.ip_address,
        note: `Blocked from order ${order.order_number}`,
      });
      setIpBlocked(true);
      toast({ title: `${order.ip_address} blocked`, variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't block this IP",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBlockingIp(false);
    }
  }

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

  const name = order ? customerName(order.customer ?? {}) : "";
  const email = order ? customerEmail(order.customer ?? {}) : "";
  const phone = order ? customerPhone(order.customer ?? {}) : "";
  const address = order ? customerAddress(order.customer ?? {}) : "";
  const itemCount = order
    ? (order.items ?? []).reduce((n, i) => n + i.quantity, 0)
    : 0;

  /** Same scoped @media print pattern as POS receipt (#pos-order-detail in globals.css). */
  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {open && order ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-4">
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
            initial={
              mdUp ? { opacity: 0, y: 8 } : { opacity: 0, y: "100%" }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={mdUp ? { opacity: 0, y: 6 } : { opacity: 0, y: "100%" }}
            transition={{ duration: mdUp ? 0.18 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="modal-panel relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl md:max-h-[90vh] md:max-w-lg md:rounded-xl md:border md:border-border"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-4 print:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="order-detail-title"
                    className="text-lg font-medium text-white"
                  >
                    {order.order_number}
                  </h3>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm text-white/80">
                  {formatDisplayDate(new Date(order.created_at))}
                  <span className="mx-1.5 text-white/50">·</span>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Print Invoice"
                  onClick={handlePrint}
                  disabled={busy}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-60"
                  title="Print Delivery Slip"
                >
                  <Printer className="size-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  disabled={busy}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
                >
                  <X className="size-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div
              id="pos-order-detail"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 print:overflow-visible print:bg-white print:text-black"
            >
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium text-muted print:text-neutral-500">
                  Customer
                </p>
                <p className="font-medium text-foreground print:text-black">
                  {name}
                </p>
                {email ? (
                  <p className="mt-0.5 text-sm text-muted print:text-neutral-700">
                    {email}
                  </p>
                ) : null}
                {phone ? (
                  <p className="mt-0.5 text-sm text-muted print:text-neutral-700">
                    {formatBdPhone(phone)}
                  </p>
                ) : null}
                {!email && !phone ? (
                  <p className="mt-0.5 text-sm text-muted-soft">
                    No contact details
                  </p>
                ) : null}
                {order.ip_address ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 print:hidden">
                    <span className="rounded-md bg-search-bg px-2 py-1 font-mono text-xs text-muted">
                      {order.ip_address}
                    </span>
                    <button
                      type="button"
                      disabled={blockingIp || ipBlocked}
                      onClick={handleBlockIp}
                      className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60 dark:hover:text-red-300"
                    >
                      <ShieldBan className="size-3" strokeWidth={2} />
                      {ipBlocked ? "Blocked" : blockingIp ? "Blocking…" : "Block this IP"}
                    </button>
                  </div>
                ) : null}
              </div>

              {(address || order.meta?.payment_method) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-border dark:border-transparent pt-5">
                  {address ? (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted">
                        Shipping address
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">
                        {address}
                      </p>
                    </div>
                  ) : null}

                  {order.meta?.payment_method ? (
                    <div>
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
                </div>
              ) : null}

              {order.notes ? (
                <div className="border-t border-border dark:border-transparent pt-5">
                  <p className="mb-1.5 text-xs font-medium text-muted">Notes</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {order.notes}
                  </p>
                </div>
              ) : null}

              {/* Products */}
              <div className="border-t border-border dark:border-transparent pt-5">
                <p className="mb-3 text-xs font-medium text-muted">
                  Products ordered
                </p>
                {(order.items ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted">
                    <Package className="size-5 text-muted-soft" strokeWidth={1.5} />
                    <p className="text-sm">No products on this order.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border dark:divide-transparent">
                    {(order.items ?? []).map((item) => (
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
              <div className="space-y-1.5 border-t border-border dark:border-transparent pt-4 text-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="mx-2 flex-1 border-b border-dashed border-slate-300" />
                  <span className="tabular-nums">
                    {formatTaka(order.subtotal_cents / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Shipping</span>
                  <span className="mx-2 flex-1 border-b border-dashed border-slate-300" />
                  <span className="tabular-nums">
                    {formatTaka(order.shipping_cents / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Tax</span>
                  <span className="mx-2 flex-1 border-b border-dashed border-slate-300" />
                  <span className="tabular-nums">
                    {formatTaka(order.tax_cents / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-[15px] font-semibold text-foreground">
                  <span>Total</span>
                  <span className="mx-2 flex-1 border-b border-dashed border-slate-300" />
                  <span className="tabular-nums">
                    {formatTaka(order.total_cents / 100)}
                    <span className="ml-1 text-xs font-normal text-muted">
                      {order.currency}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div
              className={[
                "relative z-20 shrink-0 border-t border-border px-5 py-4 print:hidden dark:border-transparent",
                "max-md:flex max-md:items-center max-md:gap-2 max-md:bg-surface max-md:px-4 max-md:py-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:max-md:bg-search-bg",
                "md:space-y-3",
              ].join(" ")}
            >
              <div className="min-w-0 max-md:w-1/2 md:flex md:flex-1 md:items-end md:gap-2">
                <div className="min-w-0 md:flex-1">
                  <p className="mb-2 hidden text-xs font-medium text-muted md:block">
                    Change status
                  </p>
                  <SettingsSelect
                    name="order-status"
                    value={status}
                    options={ORDER_STATUS_OPTIONS}
                    disabled={busy}
                    placement="top"
                    onChange={(e) => {
                      setLocalStatus(e.target.value as OrderStatus);
                    }}
                  />
                </div>
                {statusDirty ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await onStatusChange(order, status);
                      setLocalStatus(null);
                    }}
                    className="mt-2 hidden h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 md:mt-0 md:inline-flex"
                  >
                    {busy ? "Saving…" : "Update"}
                  </button>
                ) : null}
              </div>
              {statusDirty ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await onStatusChange(order, status);
                    setLocalStatus(null);
                  }}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 md:hidden"
                >
                  {busy ? "…" : "Update"}
                </button>
              ) : null}
              {order.channel !== "pos" ? (
                <div className="flex min-w-0 items-center gap-2 max-md:w-1/2 max-md:justify-end">
                  <Truck
                    className="hidden size-3.5 shrink-0 text-muted md:block"
                    strokeWidth={1.75}
                  />
                  {order.courier_consignment_id ? (
                    <>
                      <span className="truncate text-sm capitalize text-foreground">
                        {order.courier_provider}
                      </span>
                      {order.courier_tracking_code ? (
                        <span className="hidden rounded-md bg-search-bg px-2 py-1 font-mono text-xs text-muted sm:inline">
                          {order.courier_tracking_code}
                        </span>
                      ) : null}
                      <span
                        className={[
                          "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          order.delivery_status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : order.delivery_status === "cancelled"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        ].join(" ")}
                      >
                        {DELIVERY_STATUS_LABEL[order.delivery_status ?? ""] ?? "In review"}
                      </span>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={booking}
                      onClick={handleBookCourier}
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-search-bg px-3 text-sm font-medium text-foreground underline underline-offset-2 transition-colors hover:bg-border disabled:opacity-60 md:w-auto"
                    >
                      {booking ? "Booking…" : "Book with Steadfast"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
