"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldBan } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import type { OrderOut } from "@/lib/api/commerce";
import { addIpToBlocklist, reviewSuspiciousOrder } from "@/lib/api/fraud";

const REASON_LABEL: Record<string, string> = {
  high_value_first_order: "High-value first order",
  burst_orders: "Burst of orders",
};

type SuspiciousOrdersTableProps = {
  siteId: string;
  orders: OrderOut[];
  onReviewed: (orderId: string, decision: "cleared" | "confirmed_fraud") => void;
};

/** Immediate row actions — NOT part of the rest of this page's draft/Save
 * flow. A review decision is one-shot, not a setting to batch. */
export function SuspiciousOrdersTable({ siteId, orders, onReviewed }: SuspiciousOrdersTableProps) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());

  async function handleReview(order: OrderOut, decision: "cleared" | "confirmed_fraud") {
    setBusyId(order.id);
    try {
      await reviewSuspiciousOrder(siteId, order.id, decision);
      onReviewed(order.id, decision);
      toast({
        title: decision === "cleared" ? "Order cleared" : "Marked as fraud",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update this order",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleBlockIp(order: OrderOut) {
    if (!order.ip_address) return;
    setBusyId(order.id);
    try {
      await addIpToBlocklist(siteId, {
        ip_address: order.ip_address,
        note: `Blocked from order ${order.order_number}`,
      });
      setBlockedIps((prev) => new Set(prev).add(order.ip_address as string));
      toast({ title: `${order.ip_address} blocked`, variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't block this IP",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-md bg-surface">
        <EmptyState
          icon={ShieldAlert}
          title="No suspicious orders"
          description="Orders flagged by your checkout rules (high-value first orders, order bursts) show up here for review."
        />
      </div>
    );
  }

  return (
    <section className="rounded-md bg-surface">
      <div className="border-b border-border dark:border-transparent px-4 py-3.5 sm:px-5">
        <h2 className="text-base font-semibold text-foreground">
          Suspicious orders
          <span className="ml-2 align-middle text-xs font-medium text-muted">
            {orders.length}
          </span>
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Flagged for review — clearing or confirming takes effect immediately.
        </p>
      </div>
      <div className="divide-y divide-border dark:divide-transparent">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <AlertTriangle className="size-3.5" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
                  {order.order_number}
                </p>
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  {order.fraud_reason ? REASON_LABEL[order.fraud_reason] ?? order.fraud_reason : "Flagged"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs leading-snug text-muted">
                {order.currency} {(order.total_cents / 100).toFixed(2)}
                <span className="text-muted-soft">
                  {" · "}
                  {new Date(order.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {order.ip_address ? (
                  <span className="text-muted-soft">
                    {" · "}
                    <span className="font-mono">{order.ip_address}</span>
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {order.ip_address ? (
                <button
                  type="button"
                  disabled={busyId === order.id || blockedIps.has(order.ip_address)}
                  onClick={() => handleBlockIp(order)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-300"
                >
                  <ShieldBan className="size-3.5" strokeWidth={2} />
                  {blockedIps.has(order.ip_address) ? "IP blocked" : "Block IP"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => handleReview(order, "cleared")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-300"
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                Clear
              </button>
              <button
                type="button"
                disabled={busyId === order.id}
                onClick={() => handleReview(order, "confirmed_fraud")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-300"
              >
                <ShieldAlert className="size-3.5" strokeWidth={2} />
                Confirm fraud
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
