"use client";

import { Check, Copy, Pencil, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useMdUp } from "@/lib/hooks/use-md-up";
import { useToast } from "@/components/ui/toast";
import { formatBdPhone, formatDisplayDate, formatTaka } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { CustomerDetailOut, CustomerOut, RiskScore } from "@/lib/api/customers";

type CustomerDetailModalProps = {
  open: boolean;
  /** Seeded instantly from the list row on open; upgraded to the full
   * CustomerDetailOut once the network round trip for order stats settles. */
  customer: CustomerOut | CustomerDetailOut | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (name: string, email: string) => Promise<void>;
};

function isDetail(
  customer: CustomerOut | CustomerDetailOut,
): customer is CustomerDetailOut {
  return "orders" in customer;
}

/** Copy-to-clipboard button, same pattern as domains-section.tsx's CopyRow. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", variant: "info" });
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-soft transition-colors hover:bg-search-bg hover:text-primary"
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <Copy className="size-3" strokeWidth={1.75} />
      )}
    </button>
  );
}

/** Flat detail panel: editable name/email, real order stats, and the list
 * of orders actually linked to this customer — not every order this phone
 * number has ever placed (only ones since customers shipped, see
 * migrations/032_customers.sql). */
export function CustomerDetailModal({
  open,
  customer,
  busy,
  onClose,
  onSave,
}: CustomerDetailModalProps) {
  const mdUp = useMdUp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEditing(false);
    setName(customer?.name ?? "");
    setEmail(customer?.email ?? "");
  }, [customer?.id]);

  if (!customer && !open) return null;

  const detail = customer && isDetail(customer) ? customer : null;

  return (
    <AnimatePresence>
      {open && customer ? (
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
            aria-labelledby="customer-detail-title"
            initial={
              mdUp ? { opacity: 0, y: 8 } : { opacity: 0, y: "100%" }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={mdUp ? { opacity: 0, y: 6 } : { opacity: 0, y: "100%" }}
            transition={{ duration: mdUp ? 0.18 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="modal-panel relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl md:max-h-[85vh] md:max-w-lg md:rounded-xl md:border md:border-border"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/10 bg-primary px-5 py-4">
              <div className="min-w-0">
                <h3
                  id="customer-detail-title"
                  className="truncate text-lg font-medium text-white"
                >
                  {customer.name || "Unnamed customer"}
                </h3>
                <p className="mt-1 text-sm text-white/80">
                  Customer since {formatDisplayDate(new Date(customer.created_at))}
                </p>
              </div>
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

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {/* Contact info, editable */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted">Contact</p>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      <Pencil className="size-3" strokeWidth={2} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {editing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      aria-label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <input
                      aria-label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <p className="text-sm text-muted">{formatBdPhone(customer.phone)}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          await onSave(name.trim(), email.trim());
                          setEditing(false);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        <Check className="size-3.5" strokeWidth={2} />
                        {busy ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setName(customer.name ?? "");
                          setEmail(customer.email ?? "");
                          setEditing(false);
                        }}
                        className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-search-bg disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {customer.name || "Unnamed"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <p className="text-sm text-muted">
                          {formatBdPhone(customer.phone)}
                        </p>
                        <CopyButton
                          value={formatBdPhone(customer.phone)}
                          label="phone number"
                        />
                      </div>
                      {customer.email ? (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="text-sm text-muted">{customer.email}</p>
                          <CopyButton value={customer.email} label="email" />
                        </div>
                      ) : null}
                    </div>
                    {detail ? <RiskBadge risk={detail.risk_score} /> : null}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-5 dark:border-transparent">
                <div>
                  <p className="text-xs font-medium text-muted">Orders</p>
                  {detail ? (
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                      {detail.order_count}
                    </p>
                  ) : (
                    <div className="mt-1.5 h-6 w-8 animate-pulse rounded bg-search-bg" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Total Spent</p>
                  {detail ? (
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                      {formatTaka(detail.total_spent_cents / 100)}
                    </p>
                  ) : (
                    <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-search-bg" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Last Order</p>
                  {detail ? (
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {detail.last_order_at
                        ? formatDisplayDate(new Date(detail.last_order_at))
                        : "—"}
                    </p>
                  ) : (
                    <div className="mt-1.5 h-5 w-20 animate-pulse rounded bg-search-bg" />
                  )}
                </div>
              </div>

              {detail ? <RiskSignals risk={detail.risk_score} /> : null}

              {/* Linked orders — capped height so a customer with dozens of
                  orders scrolls inside this section instead of blowing up
                  the whole modal's height. */}
              <div className="border-t border-border pt-5 dark:border-transparent">
                <p className="mb-2 text-xs font-medium text-muted">
                  Orders{detail ? ` (${detail.orders.length})` : ""}
                </p>
                {!detail ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-md bg-search-bg" />
                    ))}
                  </div>
                ) : detail.orders.length === 0 ? (
                  <p className="text-sm text-muted-soft">
                    No orders linked to this customer yet.
                  </p>
                ) : (
                  <ul className="max-h-64 divide-y divide-border overflow-y-auto dark:divide-transparent">
                    {detail.orders.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDisplayDate(new Date(order.created_at))}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatTaka(order.total_cents / 100)}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

const LABEL_STYLES: Record<RiskScore["label"], string> = {
  Low: "bg-emerald-500/10 text-emerald-600",
  Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  High: "bg-rose-500/10 text-rose-600",
};

const RING_STYLES: Record<RiskScore["label"], string> = {
  Low: "border-emerald-500/30",
  Medium: "border-amber-500/30",
  High: "border-rose-500/30",
};

function signalRows(risk: RiskScore): { label: string; value: string }[] {
  const s = risk.signals;
  return [
    { label: "Previous orders", value: String(s.previous_orders) },
    { label: "Delivered", value: String(s.delivered) },
    { label: "Cancelled", value: String(s.cancelled) },
    {
      label: "Delivery success",
      value: s.delivery_success_rate === null ? "No data yet" : `${s.delivery_success_rate}%`,
    },
    { label: "COD orders", value: String(s.cod_orders) },
    {
      label: "Device history",
      value: s.device_known === null ? "No current order" : s.device_known ? "Known" : "New",
    },
    { label: "IP history", value: s.ip_blocklisted ? "Blocked" : "Normal" },
    { label: "Duplicate order", value: s.has_open_duplicate_order ? "Yes" : "No" },
    { label: "Courier history", value: s.courier_history_available ? "Available" : "None yet" },
  ];
}

function RiskBadge({ risk }: { risk: RiskScore }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums text-foreground ${RING_STYLES[risk.label]}`}
      >
        {risk.score}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LABEL_STYLES[risk.label]}`}
      >
        {risk.label}
      </span>
    </div>
  );
}

function RiskSignals({ risk }: { risk: RiskScore }) {
  return (
    <dl className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border pt-5 dark:border-transparent">
      {signalRows(risk).map((row) => (
        <div key={row.label}>
          <dt className="text-[11px] text-muted-soft">{row.label}</dt>
          <dd className="text-sm font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
