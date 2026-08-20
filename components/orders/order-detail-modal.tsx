"use client";

import { ImageOff, Package, Printer, X } from "lucide-react";
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

  const handlePrint = () => {
    if (!order) return;
    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order ${order.order_number}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            h1 { margin: 0 0 5px; font-size: 24px; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .meta { color: #666; font-size: 14px; }
            .row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 40px; }
            .col { flex: 1; }
            h3 { font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            p { margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px 0; text-align: left; border-bottom: 1px solid #eee; }
            th { font-weight: 600; color: #666; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #eee; font-size: 14px; }
            .totals-row:last-child { border-bottom: none; font-weight: bold; font-size: 16px; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Delivery Slip / Invoice</h1>
            <div class="meta">Order #${order.order_number} &bull; ${formatDisplayDate(new Date(order.created_at))}</div>
          </div>
          
          <div class="row">
            <div class="col">
              <h3>Customer Details</h3>
              <p><strong>${name}</strong><br/>${email ? email + '<br/>' : ''}${phone ? phone : ''}</p>
            </div>
            <div class="col">
              <h3>Shipping Address</h3>
              <p>${address || 'No address provided'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong>${item.name_snapshot}</strong>
                    ${item.sku_snapshot ? `<br/><span style="color:#666;font-size:12px;">SKU: ${item.sku_snapshot}</span>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td class="text-right">${formatTaka(item.unit_price_cents / 100)}</td>
                  <td class="text-right">${formatTaka(item.total_cents / 100)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatTaka(order.subtotal_cents / 100)}</span>
            </div>
            <div class="totals-row">
              <span>Shipping</span>
              <span>${formatTaka(order.shipping_cents / 100)}</span>
            </div>
            <div class="totals-row">
              <span>Tax</span>
              <span>${formatTaka(order.tax_cents / 100)}</span>
            </div>
            <div class="totals-row">
              <span>Total</span>
              <span>${formatTaka(order.total_cents / 100)} ${order.currency}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="order-detail-title"
                    className="text-base font-semibold text-white"
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

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Customer + status side by side */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                      className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
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
                {order.items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted">
                    <Package className="size-5 text-muted-soft" strokeWidth={1.5} />
                    <p className="text-sm">No products on this order.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border dark:divide-transparent">
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
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
